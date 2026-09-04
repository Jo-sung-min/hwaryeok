package com.hwaryeok.ingredient;

import java.sql.Timestamp;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.hwaryeok.common.error.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
@Transactional(readOnly = true)
public class IngredientRegulationService {

    private static final String DISCLAIMER =
            "국가와 제품 유형, 사용 부위, 농도에 따라 조건이 달라질 수 있으며 이 정보만으로 제품의 위험이나 적합성을 단정할 수 없습니다.";

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public IngredientRegulationService(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    List<AdminIngredientRegulationReviewResponse> findAllVerifiedReviews() {
        return jdbc.query("""
                SELECT review.ingredient_id, regulation.source_record_id, regulation.standard_name,
                       regulation.english_name, regulation.cas_no, regulation.restriction_type,
                       regulation.restriction_text, regulation.proviso, regulation.collected_at,
                       regulation.raw_payload, reviewer.nickname, review.reviewed_at, review.review_note
                FROM mfds_ingredient_regulation_reviews review
                JOIN mfds_ingredient_regulations regulation
                  ON regulation.source_record_id = review.source_record_id
                LEFT JOIN users reviewer ON reviewer.id = review.reviewed_by
                ORDER BY review.reviewed_at DESC, review.ingredient_id, regulation.source_record_id
                """, (rs, rowNum) -> {
            SourceFields fields = sourceFields(rs.getString("raw_payload"));
            return new AdminIngredientRegulationReviewResponse(
                    rs.getString("ingredient_id"),
                    rs.getString("source_record_id"),
                    rs.getString("standard_name"),
                    rs.getString("english_name"),
                    rs.getString("cas_no"),
                    fields.country(),
                    fields.noticeIngredientName(),
                    rs.getString("restriction_type"),
                    rs.getString("restriction_text"),
                    rs.getString("proviso"),
                    instant(rs.getTimestamp("collected_at")),
                    rs.getString("nickname"),
                    instant(rs.getTimestamp("reviewed_at")),
                    rs.getString("review_note")
            );
        });
    }

    List<IngredientRegulationCandidateResponse> findCandidates(String ingredientId, String requestedQuery, int limit) {
        IngredientIdentity ingredient = findIngredient(ingredientId);
        if (limit < 1 || limit > 20) throw new IllegalArgumentException("후보 수는 1~20 사이여야 해요.");
        String query = clean(requestedQuery).isBlank() ? ingredient.name() : clean(requestedQuery);
        if (query.length() < 2) throw new IllegalArgumentException("두 글자 이상의 성분명을 입력해 주세요.");
        if (query.length() > 120) throw new IllegalArgumentException("성분명 검색어는 120자 이하로 입력해 주세요.");
        String normalizedQuery = normalizeName(query);

        return jdbc.query("""
                SELECT regulation.source_record_id, regulation.standard_name, regulation.normalized_name,
                       regulation.english_name, regulation.cas_no, regulation.restriction_type,
                       regulation.restriction_text, regulation.proviso, regulation.collected_at,
                       regulation.raw_payload,
                       CASE WHEN review.source_record_id IS NULL THEN FALSE ELSE TRUE END AS verified
                FROM mfds_ingredient_regulations regulation
                LEFT JOIN mfds_ingredient_regulation_reviews review
                  ON review.ingredient_id = ? AND review.source_record_id = regulation.source_record_id
                WHERE regulation.normalized_name = ?
                   OR POSITION(? IN regulation.normalized_name) > 0
                   OR POSITION(? IN LOWER(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(regulation.english_name, ''), ' ', ''), '-', ''), '/', ''), '.', ''))) > 0
                ORDER BY CASE WHEN regulation.normalized_name = ? THEN 0 ELSE 1 END,
                         regulation.collected_at DESC, regulation.source_record_id
                LIMIT ?
                """, (rs, rowNum) -> candidate(
                normalizedQuery,
                rs.getString("source_record_id"),
                rs.getString("standard_name"),
                rs.getString("normalized_name"),
                rs.getString("english_name"),
                rs.getString("cas_no"),
                rs.getString("restriction_type"),
                rs.getString("restriction_text"),
                rs.getString("proviso"),
                instant(rs.getTimestamp("collected_at")),
                rs.getString("raw_payload"),
                rs.getBoolean("verified")
        ), ingredientId, normalizedQuery, normalizedQuery, normalizedQuery, normalizedQuery, limit);
    }

    @Transactional
    AdminIngredientRegulationReviewResponse verify(
            String ingredientId,
            String sourceRecordId,
            String reviewerId,
            String reviewNote
    ) {
        findIngredient(ingredientId);
        lockIngredient(ingredientId);
        String cleanedSourceRecordId = clean(sourceRecordId);
        if (cleanedSourceRecordId.isBlank()) throw new IllegalArgumentException("검수할 사용조건 후보를 선택해 주세요.");
        if (count("SELECT COUNT(*) FROM mfds_ingredient_regulations WHERE source_record_id = ?", cleanedSourceRecordId) == 0) {
            throw new ResourceNotFoundException("식약처 사용조건 레코드를 찾을 수 없어요.");
        }
        String cleanedNote = clean(reviewNote);
        if (cleanedNote.length() > 500) throw new IllegalArgumentException("검수 메모는 500자 이하로 입력해 주세요.");
        Instant now = Instant.now();
        int updated = jdbc.update("""
                UPDATE mfds_ingredient_regulation_reviews
                SET reviewed_by = ?, reviewed_at = ?, review_note = ?
                WHERE ingredient_id = ? AND source_record_id = ?
                """, reviewerId, Timestamp.from(now), nullable(cleanedNote), ingredientId, cleanedSourceRecordId);
        if (updated == 0) {
            jdbc.update("""
                    INSERT INTO mfds_ingredient_regulation_reviews (
                        ingredient_id, source_record_id, reviewed_by, reviewed_at, review_note
                    ) VALUES (?, ?, ?, ?, ?)
                    """, ingredientId, cleanedSourceRecordId, reviewerId, Timestamp.from(now), nullable(cleanedNote));
        }
        return findAllVerifiedReviews().stream()
                .filter(review -> ingredientId.equals(review.ingredientId()) && cleanedSourceRecordId.equals(review.sourceRecordId()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("저장한 사용조건 검수정보를 찾지 못했어요."));
    }

    @Transactional
    void remove(String ingredientId, String sourceRecordId) {
        findIngredient(ingredientId);
        lockIngredient(ingredientId);
        jdbc.update("""
                DELETE FROM mfds_ingredient_regulation_reviews
                WHERE ingredient_id = ? AND source_record_id = ?
                """, ingredientId, sourceRecordId);
    }

    public List<IngredientRegulationResponse> findVerified(String ingredientId) {
        findIngredient(ingredientId);
        return verifiedForIds(List.of(ingredientId)).getOrDefault(ingredientId, List.of());
    }

    public Map<String, List<IngredientRegulationResponse>> findVerifiedForIngredientIds(List<String> ingredientIds) {
        if (ingredientIds == null || ingredientIds.isEmpty()) return Map.of();
        return verifiedForIds(ingredientIds.stream().distinct().toList());
    }

    private Map<String, List<IngredientRegulationResponse>> verifiedForIds(List<String> ingredientIds) {
        String placeholders = String.join(", ", java.util.Collections.nCopies(ingredientIds.size(), "?"));
        Map<String, List<IngredientRegulationResponse>> grouped = new LinkedHashMap<>();
        jdbc.query("""
                SELECT review.ingredient_id, regulation.source_record_id, regulation.standard_name,
                       regulation.english_name, regulation.cas_no, regulation.restriction_type,
                       regulation.restriction_text, regulation.proviso, regulation.collected_at,
                       source.source_url, regulation.raw_payload
                FROM mfds_ingredient_regulation_reviews review
                JOIN mfds_ingredient_regulations regulation
                  ON regulation.source_record_id = review.source_record_id
                JOIN cosmetic_data_sources source ON source.id = 'MFDS_RESTRICTED'
                WHERE review.ingredient_id IN (%s)
                ORDER BY review.ingredient_id, regulation.standard_name, regulation.source_record_id
                """.formatted(placeholders), rs -> {
            SourceFields fields = sourceFields(rs.getString("raw_payload"));
            IngredientRegulationResponse response = new IngredientRegulationResponse(
                    rs.getString("source_record_id"),
                    rs.getString("standard_name"),
                    rs.getString("english_name"),
                    rs.getString("cas_no"),
                    fields.country(),
                    fields.noticeIngredientName(),
                    rs.getString("restriction_type"),
                    rs.getString("restriction_text"),
                    rs.getString("proviso"),
                    instant(rs.getTimestamp("collected_at")),
                    rs.getString("source_url"),
                    DISCLAIMER
            );
            grouped.computeIfAbsent(rs.getString("ingredient_id"), ignored -> new ArrayList<>()).add(response);
        }, ingredientIds.toArray());
        grouped.replaceAll((key, values) -> List.copyOf(values));
        return Map.copyOf(grouped);
    }

    private IngredientRegulationCandidateResponse candidate(
            String normalizedQuery,
            String sourceRecordId,
            String standardName,
            String normalizedName,
            String englishName,
            String casNo,
            String restrictionType,
            String restrictionText,
            String proviso,
            Instant checkedAt,
            String rawPayload,
            boolean verified
    ) {
        String normalizedEnglish = normalizeName(englishName);
        int confidence = normalizedQuery.equals(normalizedName) ? 100
                : normalizedQuery.equals(normalizedEnglish) ? 95 : 75;
        List<String> reasons = new ArrayList<>();
        if (confidence == 100) reasons.add("표준 성분명이 정확히 일치해요.");
        else if (confidence == 95) reasons.add("영문 성분명이 정확히 일치해요.");
        else reasons.add("성분명 일부가 일치해요. 원문 확인이 필요해요.");
        if (!clean(casNo).isBlank()) reasons.add("CAS No를 함께 확인할 수 있어요.");
        SourceFields fields = sourceFields(rawPayload);
        return new IngredientRegulationCandidateResponse(
                sourceRecordId,
                standardName,
                englishName,
                casNo,
                fields.country(),
                fields.noticeIngredientName(),
                restrictionType,
                restrictionText,
                proviso,
                checkedAt,
                confidence,
                List.copyOf(reasons),
                verified
        );
    }

    private SourceFields sourceFields(String rawPayload) {
        try {
            JsonNode node = objectMapper.readTree(clean(rawPayload));
            return new SourceFields(
                    firstText(node, "COUNTRY_NAME", "countryName", "country"),
                    firstText(node, "NOTICE_INGR_NAME", "noticeIngredientName")
            );
        } catch (Exception ignored) {
            return new SourceFields(null, null);
        }
    }

    private String firstText(JsonNode node, String... names) {
        if (node == null) return null;
        for (String name : names) {
            JsonNode value = node.get(name);
            if (value != null && !value.isNull() && !value.isObject() && !value.isArray()) {
                String text = clean(value.asString());
                if (!text.isBlank()) return text;
            }
        }
        return null;
    }

    private IngredientIdentity findIngredient(String ingredientId) {
        return jdbc.query("SELECT id, name, english_name FROM ingredients WHERE id = ?", (rs, rowNum) -> new IngredientIdentity(
                rs.getString("id"), rs.getString("name"), rs.getString("english_name")
        ), ingredientId).stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("성분을 찾을 수 없어요."));
    }

    private void lockIngredient(String ingredientId) {
        jdbc.queryForObject("SELECT id FROM ingredients WHERE id = ? FOR UPDATE", String.class, ingredientId);
    }

    private int count(String sql, Object... arguments) {
        Long value = jdbc.queryForObject(sql, Long.class, arguments);
        return value == null ? 0 : Math.toIntExact(value);
    }

    private static Instant instant(Timestamp value) {
        return value == null ? null : value.toInstant();
    }

    private static String nullable(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private static String normalizeName(String value) {
        String normalized = Normalizer.normalize(clean(value), Normalizer.Form.NFKC).toLowerCase(Locale.ROOT);
        return normalized.replaceAll("[\\s._()·ㆍ/\\-]", "");
    }

    private static String clean(String value) {
        return value == null ? "" : value.replace('\u00a0', ' ').strip();
    }

    private record IngredientIdentity(String id, String name, String englishName) {
    }

    private record SourceFields(String country, String noticeIngredientName) {
    }
}
