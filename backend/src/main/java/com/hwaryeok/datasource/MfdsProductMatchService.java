package com.hwaryeok.datasource;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import com.hwaryeok.common.error.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MfdsProductMatchService {

    private static final int SEARCH_POOL_SIZE = 300;
    private static final Set<String> GENERIC_PRODUCT_WORDS = Set.of(
            "토너", "크림", "세럼", "앰플", "에센스", "로션", "선크림", "클렌저", "마스크", "미스트", "오일"
    );
    private static final String PUBLIC_DISCLAIMER =
            "이 표시는 식약처 공개 보고정보와 제품을 연결했다는 뜻이며, 제품의 효능이나 개인별 안전성을 보장하지 않습니다.";

    private final JdbcTemplate jdbc;

    public MfdsProductMatchService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<AdminMfdsProductMatchResponse> findAllReviewDecisions() {
        return jdbc.query("""
                SELECT decision.product_id, decision.review_status, decision.report_id,
                       mfds.product_name, mfds.company_name, mfds.manufacturer_name,
                       mfds.functional_types, mfds.report_date,
                       CASE WHEN decision.review_status = 'ADMIN_VERIFIED' THEN 100 ELSE 0 END AS confidence,
                       reviewer.nickname, decision.reviewed_at, decision.review_note
                FROM mfds_product_review_decisions decision
                LEFT JOIN mfds_cosmetic_products mfds ON mfds.report_id = decision.report_id
                LEFT JOIN users reviewer ON reviewer.id = decision.reviewed_by
                ORDER BY decision.reviewed_at DESC, decision.product_id
                """, (rs, rowNum) -> adminResponse(
                rs.getString("product_id"),
                rs.getString("review_status"),
                rs.getString("report_id"),
                rs.getString("product_name"),
                rs.getString("company_name"),
                rs.getString("manufacturer_name"),
                rs.getString("functional_types"),
                rs.getObject("report_date", LocalDate.class),
                rs.getInt("confidence"),
                rs.getString("nickname"),
                instant(rs.getTimestamp("reviewed_at")),
                rs.getString("review_note")
        ));
    }

    public List<MfdsProductCandidateResponse> findCandidates(String productId, String requestedQuery, int limit) {
        if (limit < 1 || limit > 20) throw new IllegalArgumentException("후보 수는 1~20 사이여야 해요.");
        LocalProduct product = findProduct(productId);
        String query = clean(requestedQuery).isBlank() ? product.name() : clean(requestedQuery);
        if (query.length() > 120) throw new IllegalArgumentException("검색어는 120자 이하로 입력해 주세요.");

        List<String> terms = searchTerms(query);
        if (terms.isEmpty()) throw new IllegalArgumentException("두 글자 이상의 제품명 검색어를 입력해 주세요.");

        String where = String.join(" OR ", java.util.Collections.nCopies(
                terms.size(), "POSITION(? IN normalized_product_name) > 0"
        ));
        List<Object> parameters = new ArrayList<>(terms);
        parameters.add(SEARCH_POOL_SIZE);
        List<MfdsProductRecord> records = jdbc.query("""
                        SELECT report_id, product_name, normalized_product_name, company_name,
                               manufacturer_name, functional_types, report_date
                        FROM mfds_cosmetic_products
                        WHERE %s
                        ORDER BY report_date DESC NULLS LAST, report_id
                        LIMIT ?
                        """.formatted(where),
                (rs, rowNum) -> new MfdsProductRecord(
                        rs.getString("report_id"),
                        rs.getString("product_name"),
                        rs.getString("normalized_product_name"),
                        rs.getString("company_name"),
                        rs.getString("manufacturer_name"),
                        rs.getString("functional_types"),
                        rs.getObject("report_date", LocalDate.class)
                ),
                parameters.toArray()
        );
        String currentReportId = currentReportId(productId);
        return records.stream()
                .map(record -> candidate(product, query, terms, record, currentReportId))
                .sorted(Comparator.comparingInt(MfdsProductCandidateResponse::confidence).reversed()
                        .thenComparing(MfdsProductCandidateResponse::reportDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(MfdsProductCandidateResponse::reportId))
                .limit(limit)
                .toList();
    }

    @Transactional
    public AdminMfdsProductMatchResponse saveVerifiedMatch(
            String productId,
            String reportId,
            String reviewerId,
            String reviewNote
    ) {
        findProduct(productId);
        lockProduct(productId);
        String cleanedReportId = clean(reportId);
        if (cleanedReportId.isBlank()) throw new IllegalArgumentException("연결할 식약처 품목을 선택해 주세요.");
        if (cleanedReportId.length() > 120) throw new IllegalArgumentException("식약처 품목 식별자를 확인해 주세요.");
        String cleanedNote = clean(reviewNote);
        if (cleanedNote.length() > 500) throw new IllegalArgumentException("검수 메모는 500자 이하로 입력해 주세요.");
        if (count("SELECT COUNT(*) FROM mfds_cosmetic_products WHERE report_id = ?", cleanedReportId) == 0) {
            throw new ResourceNotFoundException("연결할 식약처 품목을 찾을 수 없어요.");
        }

        jdbc.update("DELETE FROM mfds_product_matches WHERE product_id = ?", productId);
        Instant now = Instant.now();
        jdbc.update("""
                INSERT INTO mfds_product_matches (
                    product_id, report_id, match_type, confidence, matched_at,
                    reviewed_by, reviewed_at, review_note
                ) VALUES (?, ?, 'ADMIN_VERIFIED', 100, ?, ?, ?, ?)
                """,
                productId,
                cleanedReportId,
                Timestamp.from(now),
                reviewerId,
                Timestamp.from(now),
                cleanedNote.isBlank() ? null : cleanedNote
        );
        saveReviewDecision(productId, "ADMIN_VERIFIED", cleanedReportId, reviewerId, now, cleanedNote);
        return findReviewDecision(productId);
    }

    @Transactional
    public AdminMfdsProductMatchResponse saveNoMatch(String productId, String reviewerId, String reviewNote) {
        findProduct(productId);
        lockProduct(productId);
        String cleanedNote = clean(reviewNote);
        if (cleanedNote.length() < 5) {
            throw new IllegalArgumentException("검색어 또는 확인 내용을 5자 이상 검수 메모에 입력해 주세요.");
        }
        if (cleanedNote.length() > 500) throw new IllegalArgumentException("검수 메모는 500자 이하로 입력해 주세요.");

        jdbc.update("DELETE FROM mfds_product_matches WHERE product_id = ?", productId);
        saveReviewDecision(productId, "NO_MATCH", null, reviewerId, Instant.now(), cleanedNote);
        return findReviewDecision(productId);
    }

    @Transactional
    public void removeVerifiedMatch(String productId) {
        findProduct(productId);
        lockProduct(productId);
        jdbc.update("DELETE FROM mfds_product_matches WHERE product_id = ?", productId);
        jdbc.update("DELETE FROM mfds_product_review_decisions WHERE product_id = ?", productId);
    }

    public ProductRegulatorySourceResponse findPublicSource(String productId) {
        return jdbc.query("""
                SELECT match.product_id, match.report_id, mfds.product_name, mfds.company_name,
                       mfds.manufacturer_name, mfds.functional_types, mfds.report_date,
                       mfds.collected_at, source.source_url
                FROM mfds_product_matches match
                JOIN mfds_cosmetic_products mfds ON mfds.report_id = match.report_id
                JOIN products product ON product.id = match.product_id
                JOIN cosmetic_data_sources source ON source.id = 'MFDS_FUNCTIONAL'
                WHERE match.product_id = ?
                  AND match.match_type = 'ADMIN_VERIFIED'
                  AND product.publication_status = 'PUBLISHED'
                ORDER BY match.reviewed_at DESC NULLS LAST
                LIMIT 1
                """, (rs, rowNum) -> new ProductRegulatorySourceResponse(
                true,
                rs.getString("product_id"),
                "식약처 보고정보 확인",
                rs.getString("report_id"),
                rs.getString("product_name"),
                rs.getString("company_name"),
                rs.getString("manufacturer_name"),
                rs.getString("functional_types"),
                rs.getObject("report_date", LocalDate.class),
                instant(rs.getTimestamp("collected_at")),
                rs.getString("source_url"),
                PUBLIC_DISCLAIMER
        ), productId).stream().findFirst().orElseGet(() -> ProductRegulatorySourceResponse.unmatched(productId));
    }

    private AdminMfdsProductMatchResponse findReviewDecision(String productId) {
        return findAllReviewDecisions().stream()
                .filter(match -> productId.equals(match.productId()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("저장한 식약처 검수정보를 찾지 못했어요."));
    }

    private void saveReviewDecision(
            String productId,
            String reviewStatus,
            String reportId,
            String reviewerId,
            Instant reviewedAt,
            String reviewNote
    ) {
        String nullableNote = reviewNote == null || reviewNote.isBlank() ? null : reviewNote;
        int updated = jdbc.update("""
                UPDATE mfds_product_review_decisions
                SET review_status = ?, report_id = ?, reviewed_by = ?, reviewed_at = ?, review_note = ?
                WHERE product_id = ?
                """, reviewStatus, reportId, reviewerId, Timestamp.from(reviewedAt), nullableNote, productId);
        if (updated == 0) {
            jdbc.update("""
                    INSERT INTO mfds_product_review_decisions (
                        product_id, review_status, report_id, reviewed_by, reviewed_at, review_note
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    """, productId, reviewStatus, reportId, reviewerId, Timestamp.from(reviewedAt), nullableNote);
        }
    }

    private MfdsProductCandidateResponse candidate(
            LocalProduct product,
            String query,
            List<String> terms,
            MfdsProductRecord record,
            String currentReportId
    ) {
        String normalizedQuery = CosmeticDataPipelineService.normalizeName(query);
        String normalizedCandidate = clean(record.normalizedName());
        double editSimilarity = similarity(normalizedQuery, normalizedCandidate);
        long containedTerms = terms.stream().filter(normalizedCandidate::contains).count();
        double termRatio = terms.isEmpty() ? 0 : (double) containedTerms / terms.size();
        String normalizedBrand = CosmeticDataPipelineService.normalizeName(product.brand());
        String normalizedCompany = CosmeticDataPipelineService.normalizeName(record.companyName());
        boolean companyHint = !normalizedBrand.isBlank() && !normalizedCompany.isBlank()
                && (normalizedCompany.contains(normalizedBrand) || normalizedBrand.contains(normalizedCompany));

        int confidence;
        List<String> reasons = new ArrayList<>();
        if (normalizedQuery.equals(normalizedCandidate)) {
            confidence = 100;
            reasons.add("제품명이 정규화 기준으로 일치해요.");
        } else if (normalizedCandidate.contains(normalizedQuery) || normalizedQuery.contains(normalizedCandidate)) {
            confidence = 92;
            reasons.add("제품명 핵심 문구가 포함돼요.");
        } else {
            confidence = (int) Math.round(45 + termRatio * 30 + editSimilarity * 20);
            reasons.add(containedTerms + "개의 제품명 단어가 일치해요.");
        }
        if (companyHint) {
            confidence += 5;
            reasons.add("브랜드와 업체명이 유사해요.");
        }
        confidence = Math.clamp(confidence, 1, 99);
        return new MfdsProductCandidateResponse(
                record.reportId(),
                record.productName(),
                record.companyName(),
                record.manufacturerName(),
                record.reportBasis(),
                record.reportDate(),
                confidence,
                reasons,
                record.reportId().equals(currentReportId)
        );
    }

    private List<String> searchTerms(String query) {
        LinkedHashSet<String> terms = new LinkedHashSet<>();
        String whole = CosmeticDataPipelineService.normalizeName(query);
        if (whole.length() >= 2) terms.add(whole);
        Arrays.stream(query.toLowerCase(Locale.ROOT).split("[^0-9a-z가-힣]+"))
                .map(CosmeticDataPipelineService::normalizeName)
                .filter(term -> term.length() >= 2)
                .filter(term -> !GENERIC_PRODUCT_WORDS.contains(term))
                .sorted(Comparator.comparingInt(String::length).reversed())
                .limit(4)
                .forEach(terms::add);
        if (terms.size() == 1 && GENERIC_PRODUCT_WORDS.contains(whole)) terms.clear();
        return terms.stream().limit(5).toList();
    }

    private LocalProduct findProduct(String productId) {
        return jdbc.query("SELECT id, brand, name FROM products WHERE id = ?", (rs, rowNum) -> new LocalProduct(
                rs.getString("id"), rs.getString("brand"), rs.getString("name")
        ), productId).stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("제품을 찾을 수 없어요."));
    }

    private void lockProduct(String productId) {
        jdbc.queryForObject("SELECT id FROM products WHERE id = ? FOR UPDATE", String.class, productId);
    }

    private String currentReportId(String productId) {
        return jdbc.query("""
                SELECT report_id FROM mfds_product_matches
                WHERE product_id = ? AND match_type = 'ADMIN_VERIFIED'
                ORDER BY reviewed_at DESC NULLS LAST LIMIT 1
                """, (rs, rowNum) -> rs.getString("report_id"), productId).stream().findFirst().orElse("");
    }

    private AdminMfdsProductMatchResponse adminResponse(
            String productId,
            String reviewStatus,
            String reportId,
            String productName,
            String companyName,
            String manufacturerName,
            String reportBasis,
            LocalDate reportDate,
            int confidence,
            String reviewerNickname,
            Instant reviewedAt,
            String reviewNote
    ) {
        return new AdminMfdsProductMatchResponse(
                productId,
                reviewStatus,
                reportId,
                productName,
                companyName,
                manufacturerName,
                reportBasis,
                reportDate,
                confidence,
                reviewerNickname,
                reviewedAt,
                reviewNote
        );
    }

    private int count(String sql, Object... arguments) {
        Long value = jdbc.queryForObject(sql, Long.class, arguments);
        return value == null ? 0 : Math.toIntExact(value);
    }

    private double similarity(String first, String second) {
        if (first.equals(second)) return 1;
        if (first.isBlank() || second.isBlank()) return 0;
        int[] previous = new int[second.length() + 1];
        for (int index = 0; index <= second.length(); index++) previous[index] = index;
        for (int firstIndex = 1; firstIndex <= first.length(); firstIndex++) {
            int[] current = new int[second.length() + 1];
            current[0] = firstIndex;
            for (int secondIndex = 1; secondIndex <= second.length(); secondIndex++) {
                int substitution = previous[secondIndex - 1]
                        + (first.charAt(firstIndex - 1) == second.charAt(secondIndex - 1) ? 0 : 1);
                current[secondIndex] = Math.min(
                        Math.min(current[secondIndex - 1] + 1, previous[secondIndex] + 1),
                        substitution
                );
            }
            previous = current;
        }
        int distance = previous[second.length()];
        return 1.0 - (double) distance / Math.max(first.length(), second.length());
    }

    private static Instant instant(Timestamp value) {
        return value == null ? null : value.toInstant();
    }

    private static String clean(String value) {
        return value == null ? "" : value.replace('\u00a0', ' ').strip();
    }

    private record LocalProduct(String id, String brand, String name) {
    }

    private record MfdsProductRecord(
            String reportId,
            String productName,
            String normalizedName,
            String companyName,
            String manufacturerName,
            String reportBasis,
            LocalDate reportDate
    ) {
    }
}
