package com.hwaryeok.datasource;

import java.net.URI;
import java.net.URISyntaxException;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional(readOnly = true)
class CosmeticDataPipelineService {

    private static final String KCIA_SOURCE = "KCIA_DICTIONARY";
    private static final long MAX_REFERENCE_FILE_BYTES = 15L * 1024 * 1024;
    private static final Pattern SAFE_ID = Pattern.compile("[^a-zA-Z0-9_-]");

    private final JdbcTemplate jdbc;
    private final ProductService productService;
    private final KciaIngredientFileParser kciaFileParser;
    private final String mfdsServiceKey;
    private final String mfdsFunctionalUrl;
    private final String mfdsRestrictedUrl;

    CosmeticDataPipelineService(
            JdbcTemplate jdbc,
            ProductService productService,
            KciaIngredientFileParser kciaFileParser,
            @Value("${app.data-sources.mfds.service-key:}") String mfdsServiceKey,
            @Value("${app.data-sources.mfds.functional-products-url:}") String mfdsFunctionalUrl,
            @Value("${app.data-sources.mfds.restricted-ingredients-url:}") String mfdsRestrictedUrl
    ) {
        this.jdbc = jdbc;
        this.productService = productService;
        this.kciaFileParser = kciaFileParser;
        this.mfdsServiceKey = clean(mfdsServiceKey);
        this.mfdsFunctionalUrl = clean(mfdsFunctionalUrl);
        this.mfdsRestrictedUrl = clean(mfdsRestrictedUrl);
    }

    DataPipelineStatusResponse status() {
        List<DataSourceStatusResponse> sources = jdbc.query("""
                SELECT ds.id, ds.display_name, ds.source_url, ds.terms_url, ds.ingestion_mode, ds.usage_note,
                       (SELECT r.status FROM cosmetic_ingestion_runs r WHERE r.source_id = ds.id
                        ORDER BY r.started_at DESC LIMIT 1) AS last_status,
                       (SELECT r.finished_at FROM cosmetic_ingestion_runs r WHERE r.source_id = ds.id
                        ORDER BY r.started_at DESC LIMIT 1) AS last_run_at
                FROM cosmetic_data_sources ds
                ORDER BY ds.priority
                """, (rs, rowNum) -> {
            String sourceId = rs.getString("id");
            Timestamp timestamp = rs.getTimestamp("last_run_at");
            return new DataSourceStatusResponse(
                    sourceId,
                    rs.getString("display_name"),
                    rs.getString("source_url"),
                    rs.getString("terms_url"),
                    rs.getString("ingestion_mode"),
                    rs.getString("usage_note"),
                    isConfigured(sourceId),
                    recordCount(sourceId),
                    rs.getString("last_status"),
                    timestamp == null ? null : timestamp.toInstant()
            );
        });
        return new DataPipelineStatusResponse(
                sources,
                count("SELECT COUNT(*) FROM cosmetic_ingredient_references"),
                count("SELECT COUNT(*) FROM mfds_cosmetic_products"),
                count("SELECT COUNT(*) FROM mfds_ingredient_regulations"),
                count("SELECT COUNT(*) FROM product_ingredient_sources"),
                count("SELECT COUNT(*) FROM product_ingredient_sources WHERE verification_status = 'VERIFIED' AND published = TRUE")
        );
    }

    List<OfficialIngredientListResponse> findOfficialIngredientSources() {
        return jdbc.query("""
                SELECT product_id, source_url, source_domain, page_title, raw_ingredient_text, checked_at,
                       total_ingredient_count, matched_ingredient_count, unmatched_ingredients,
                       verification_status, published
                FROM product_ingredient_sources
                ORDER BY product_id
                """, (rs, rowNum) -> new OfficialIngredientListResponse(
                rs.getString("product_id"),
                rs.getString("source_url"),
                rs.getString("source_domain"),
                rs.getString("page_title"),
                rs.getString("raw_ingredient_text"),
                rs.getObject("checked_at", LocalDate.class),
                rs.getInt("total_ingredient_count"),
                rs.getInt("matched_ingredient_count"),
                lines(rs.getString("unmatched_ingredients")),
                rs.getString("verification_status"),
                rs.getBoolean("published")
        ));
    }

    @Transactional
    DataImportResultResponse importKciaDictionary(MultipartFile file, boolean rightsConfirmed) {
        if (!rightsConfirmed) {
            throw new IllegalArgumentException("대한화장품협회 이용조건과 데이터 사용권 확인에 동의해 주세요.");
        }
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("성분사전 CSV 또는 XLSX 파일을 선택해 주세요.");
        if (file.getSize() > MAX_REFERENCE_FILE_BYTES) throw new IllegalArgumentException("성분사전 파일은 15MB 이하만 업로드할 수 있어요.");

        byte[] content;
        try {
            content = file.getBytes();
        } catch (Exception exception) {
            throw new IllegalArgumentException("성분사전 파일을 읽을 수 없어요.");
        }
        List<KciaIngredientRow> rows = kciaFileParser.parse(content);
        String runId = startRun(KCIA_SOURCE, safeFileName(file.getOriginalFilename()));

        jdbc.update("DELETE FROM cosmetic_ingredient_references WHERE source_id = ?", KCIA_SOURCE);
        jdbc.batchUpdate("""
                INSERT INTO cosmetic_ingredient_references (
                    source_id, source_ingredient_id, standard_name, normalized_name,
                    english_name, cas_no, former_name, collected_at, raw_source_row
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement statement, int index) throws java.sql.SQLException {
                KciaIngredientRow row = rows.get(index);
                statement.setString(1, KCIA_SOURCE);
                statement.setString(2, limit(row.sourceIngredientId(), 120));
                statement.setString(3, limit(row.standardName(), 300));
                statement.setString(4, limit(normalizeName(row.standardName()), 300));
                statement.setString(5, nullable(limit(row.englishName(), 500)));
                statement.setString(6, nullable(limit(row.casNo(), 200)));
                statement.setString(7, nullable(limit(row.formerName(), 500)));
                statement.setTimestamp(8, Timestamp.from(Instant.now()));
                statement.setString(9, limit(String.join("\t", row.sourceIngredientId(), row.standardName(), row.englishName(), row.casNo(), row.formerName()), 4000));
            }

            @Override
            public int getBatchSize() {
                return rows.size();
            }
        });

        List<AliasRow> aliases = rows.stream().flatMap(row -> aliases(row).stream()).toList();
        jdbc.batchUpdate("""
                INSERT INTO cosmetic_ingredient_aliases (
                    source_id, source_ingredient_id, alias, normalized_alias, alias_type
                ) VALUES (?, ?, ?, ?, ?)
                """, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement statement, int index) throws java.sql.SQLException {
                AliasRow alias = aliases.get(index);
                statement.setString(1, KCIA_SOURCE);
                statement.setString(2, limit(alias.sourceIngredientId(), 120));
                statement.setString(3, limit(alias.alias(), 500));
                statement.setString(4, limit(alias.normalizedAlias(), 300));
                statement.setString(5, alias.type());
            }

            @Override
            public int getBatchSize() {
                return aliases.size();
            }
        });
        finishRun(runId, rows.size(), rows.size(), 0);
        return new DataImportResultResponse(
                KCIA_SOURCE,
                "SUCCEEDED",
                rows.size(),
                rows.size(),
                0,
                "협회 공식 성분명 " + rows.size() + "건을 PostgreSQL 기준 사전에 적재했어요."
        );
    }

    @Transactional
    OfficialIngredientListResponse saveOfficialIngredientList(String productId, OfficialIngredientListRequest request) {
        Product product = productService.getAdminProduct(productId);
        // 제품 단위로 직렬화해 UPDATE 후 INSERT 방식의 upsert가 동시 요청에도 안전하도록 합니다.
        jdbc.queryForObject("SELECT id FROM products WHERE id = ? FOR UPDATE", String.class, productId);
        if (request == null) throw new IllegalArgumentException("공식 전성분 정보를 입력해 주세요.");
        if (!request.officialSourceConfirmed()) throw new IllegalArgumentException("브랜드 공식 페이지 확인에 동의해 주세요.");
        String sourceUrl = validateOfficialUrl(request.sourceUrl());
        String pageTitle = required(request.pageTitle(), "공식 페이지 제목을 입력해 주세요.", 300);
        LocalDate checkedAt = request.checkedAt();
        if (checkedAt == null) throw new IllegalArgumentException("공식 페이지 확인일을 입력해 주세요.");
        if (checkedAt.isAfter(LocalDate.now())) throw new IllegalArgumentException("확인일은 미래 날짜로 입력할 수 없어요.");
        String rawText = required(request.ingredientText(), "전성분 원문을 입력해 주세요.", 30_000);
        List<String> rawIngredients = splitIngredients(rawText);
        if (rawIngredients.isEmpty()) throw new IllegalArgumentException("쉼표 또는 줄바꿈으로 구분된 전성분을 입력해 주세요.");
        if (rawIngredients.size() > 250) throw new IllegalArgumentException("한 제품의 전성분은 최대 250개까지 확인할 수 있어요.");

        List<MatchedIngredient> matched = new ArrayList<>();
        List<String> unmatched = new ArrayList<>();
        for (String rawIngredient : rawIngredients) {
            MatchedIngredient match = matchIngredient(rawIngredient);
            if (match == null) unmatched.add(rawIngredient);
            else matched.add(match);
        }
        String status = unmatched.isEmpty() ? "VERIFIED" : matched.isEmpty() ? "UNMATCHED" : "PARTIAL";
        boolean published = unmatched.isEmpty();
        if (published) replaceProductIngredients(product, matched, checkedAt);

        URI uri = URI.create(sourceUrl);
        String sourceDomain = uri.getHost().toLowerCase(Locale.ROOT);
        String unmatchedText = unmatched.isEmpty() ? null : String.join("\n", unmatched);
        Timestamp updatedAt = Timestamp.from(Instant.now());
        int updated = jdbc.update("""
                UPDATE product_ingredient_sources
                SET source_url = ?, source_domain = ?, page_title = ?, raw_ingredient_text = ?,
                    total_ingredient_count = ?, matched_ingredient_count = ?, unmatched_ingredients = ?,
                    verification_status = ?, published = ?, checked_at = ?, updated_at = ?
                WHERE product_id = ?
                """,
                sourceUrl, sourceDomain, pageTitle, rawText,
                rawIngredients.size(), matched.size(), unmatchedText,
                status, published, checkedAt, updatedAt, productId
        );
        if (updated == 0) {
            jdbc.update("""
                    INSERT INTO product_ingredient_sources (
                        product_id, source_type, source_url, source_domain, page_title, raw_ingredient_text,
                        total_ingredient_count, matched_ingredient_count, unmatched_ingredients,
                        verification_status, published, checked_at, updated_at
                    ) VALUES (?, 'BRAND_OFFICIAL', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    productId, sourceUrl, sourceDomain, pageTitle, rawText,
                    rawIngredients.size(), matched.size(), unmatchedText,
                    status, published, checkedAt, updatedAt
            );
        }
        return new OfficialIngredientListResponse(
                productId, sourceUrl, sourceDomain, pageTitle, rawText, checkedAt,
                rawIngredients.size(), matched.size(), List.copyOf(unmatched), status, published
        );
    }

    private void replaceProductIngredients(Product product, List<MatchedIngredient> matched, LocalDate checkedAt) {
        Map<String, MatchedIngredient> unique = new LinkedHashMap<>();
        for (MatchedIngredient item : matched) unique.putIfAbsent(item.ingredientId(), item);
        if (unique.size() != matched.size()) {
            throw new IllegalArgumentException("같은 표준 성분으로 해석되는 전성분이 중복돼 있어 원문을 확인해 주세요.");
        }
        jdbc.update("DELETE FROM product_ingredients WHERE product_id = ?", product.getId());
        int order = 1;
        for (MatchedIngredient item : unique.values()) {
            jdbc.update("""
                    INSERT INTO product_ingredients (product_id, ingredient_id, display_order, concentration_note)
                    VALUES (?, ?, ?, ?)
                    """, product.getId(), item.ingredientId(), order++, "공식 전성분 · " + checkedAt);
        }
    }

    private MatchedIngredient matchIngredient(String rawIngredient) {
        String normalized = normalizeName(rawIngredient);
        List<ReferenceMatch> candidates = jdbc.query("""
                SELECT r.source_id, r.source_ingredient_id, r.standard_name, r.english_name
                FROM cosmetic_ingredient_aliases a
                JOIN cosmetic_ingredient_references r
                  ON r.source_id = a.source_id AND r.source_ingredient_id = a.source_ingredient_id
                WHERE a.normalized_alias = ?
                ORDER BY CASE r.source_id WHEN 'KCIA_DICTIONARY' THEN 0 WHEN 'LEGACY_CURATED' THEN 1 ELSE 2 END,
                         r.source_ingredient_id
                """, (rs, rowNum) -> new ReferenceMatch(
                rs.getString("source_id"),
                rs.getString("source_ingredient_id"),
                rs.getString("standard_name"),
                rs.getString("english_name")
        ), normalized);
        if (candidates.isEmpty()) return null;
        ReferenceMatch selected = candidates.getFirst();
        long distinctNames = candidates.stream().map(ReferenceMatch::standardName).distinct().count();
        if (distinctNames > 1 && candidates.stream().filter(item -> item.sourceId().equals(KCIA_SOURCE)).count() != 1) return null;
        String ingredientId = ensureCuratedIngredient(selected);
        return new MatchedIngredient(ingredientId, rawIngredient);
    }

    private String ensureCuratedIngredient(ReferenceMatch reference) {
        List<String> existing = jdbc.query(
                "SELECT id FROM ingredients WHERE name = ? ORDER BY id LIMIT 1",
                (rs, rowNum) -> rs.getString("id"),
                reference.standardName()
        );
        if (!existing.isEmpty()) return existing.getFirst();
        String id = reference.sourceId().equals("LEGACY_CURATED")
                ? reference.sourceIngredientId()
                : "kcia-" + SAFE_ID.matcher(reference.sourceIngredientId()).replaceAll("").toLowerCase(Locale.ROOT);
        id = limit(id.isBlank() ? "ingredient-" + UUID.randomUUID().toString().substring(0, 12) : id, 64);
        jdbc.update("""
                INSERT INTO ingredients (
                    id, name, english_name, role, description, status, caution,
                    evidence_level, featured, display_order
                )
                SELECT ?, ?, ?, '기능 정보 확인 중', ?, 'NEUTRAL', ?, 'C', FALSE, 999
                WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE name = ?)
                """,
                id,
                reference.standardName(),
                reference.englishName() == null ? "" : reference.englishName(),
                "브랜드 공식 전성분에서 확인했고 기능 설명은 추가 검수 중인 표준 성분이에요.",
                "성분사전 등재는 사용 가능 여부를 보증하지 않아요. 식약처 사용제한 정보를 함께 확인해 주세요.",
                reference.standardName()
        );
        return jdbc.queryForObject("SELECT id FROM ingredients WHERE name = ?", String.class, reference.standardName());
    }

    private List<String> splitIngredients(String rawText) {
        String withoutLabel = rawText.replaceFirst("(?i)^\\s*(전성분|ingredients?)\\s*[:：]?\\s*", "");
        Set<String> unique = new LinkedHashSet<>();
        Arrays.stream(withoutLabel.split("[,，\\n\\r]+"))
                .map(CosmeticDataPipelineService::clean)
                .filter(value -> !value.isBlank())
                .forEach(unique::add);
        return List.copyOf(unique);
    }

    private List<AliasRow> aliases(KciaIngredientRow row) {
        Map<String, AliasRow> unique = new LinkedHashMap<>();
        addAlias(unique, row.sourceIngredientId(), row.standardName(), "STANDARD");
        addAlias(unique, row.sourceIngredientId(), row.englishName(), "ENGLISH");
        Arrays.stream(clean(row.formerName()).split("[,;，]+"))
                .forEach(alias -> addAlias(unique, row.sourceIngredientId(), alias, "FORMER"));
        return List.copyOf(unique.values());
    }

    private void addAlias(Map<String, AliasRow> aliases, String sourceId, String alias, String type) {
        String cleaned = clean(alias);
        String normalized = normalizeName(cleaned);
        if (!cleaned.isBlank() && !normalized.isBlank()) {
            aliases.putIfAbsent(normalized, new AliasRow(sourceId, cleaned, normalized, type));
        }
    }

    private String validateOfficialUrl(String value) {
        String cleaned = required(value, "브랜드 공식 페이지 주소를 입력해 주세요.", 500);
        try {
            URI uri = new URI(cleaned);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null) {
                throw new IllegalArgumentException("브랜드 공식 페이지는 사용자 정보가 없는 https 주소만 등록할 수 있어요.");
            }
            if (uri.getPort() != -1 && uri.getPort() != 443) {
                throw new IllegalArgumentException("브랜드 공식 페이지는 표준 https 포트만 사용할 수 있어요.");
            }
            rejectPrivateHostLiteral(uri.getHost());
            return uri.toString();
        } catch (URISyntaxException exception) {
            throw new IllegalArgumentException("브랜드 공식 페이지 주소 형식을 확인해 주세요.");
        }
    }

    private void rejectPrivateHostLiteral(String host) {
        String normalized = host.toLowerCase(Locale.ROOT);
        boolean privateIpv4 = normalized.matches("^(10\\.|127\\.|169\\.254\\.|192\\.168\\.).*")
                || normalized.matches("^172\\.(1[6-9]|2[0-9]|3[01])\\..*");
        boolean localIpv6 = normalized.equals("::1") || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd");
        if (normalized.equals("localhost") || normalized.endsWith(".localhost") || normalized.endsWith(".local")
                || privateIpv4 || localIpv6) {
            throw new IllegalArgumentException("공개된 브랜드 공식 도메인만 등록할 수 있어요.");
        }
    }

    private String startRun(String sourceId, String fileName) {
        String id = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO cosmetic_ingestion_runs (id, source_id, status, file_name, started_at)
                VALUES (?, ?, 'RUNNING', ?, ?)
                """, id, sourceId, fileName, Timestamp.from(Instant.now()));
        return id;
    }

    private void finishRun(String id, int read, int upserted, int skipped) {
        jdbc.update("""
                UPDATE cosmetic_ingestion_runs
                SET status = 'SUCCEEDED', records_read = ?, records_upserted = ?, records_skipped = ?, finished_at = ?
                WHERE id = ?
                """, read, upserted, skipped, Timestamp.from(Instant.now()), id);
    }

    private long recordCount(String sourceId) {
        return switch (sourceId) {
            case "MFDS_FUNCTIONAL" -> count("SELECT COUNT(*) FROM mfds_cosmetic_products");
            case "MFDS_RESTRICTED" -> count("SELECT COUNT(*) FROM mfds_ingredient_regulations");
            case "KCIA_DICTIONARY" -> count("SELECT COUNT(*) FROM cosmetic_ingredient_references WHERE source_id = 'KCIA_DICTIONARY'");
            case "BRAND_OFFICIAL" -> count("SELECT COUNT(*) FROM product_ingredient_sources");
            case "LEGACY_CURATED" -> count("SELECT COUNT(*) FROM cosmetic_ingredient_references WHERE source_id = 'LEGACY_CURATED'");
            default -> 0;
        };
    }

    private boolean isConfigured(String sourceId) {
        return switch (sourceId) {
            case "MFDS_FUNCTIONAL" -> !mfdsServiceKey.isBlank() && !mfdsFunctionalUrl.isBlank();
            case "MFDS_RESTRICTED" -> !mfdsServiceKey.isBlank() && !mfdsRestrictedUrl.isBlank();
            default -> true;
        };
    }

    private long count(String sql) {
        Long value = jdbc.queryForObject(sql, Long.class);
        return value == null ? 0 : value;
    }

    static String normalizeName(String value) {
        String normalized = Normalizer.normalize(clean(value), Normalizer.Form.NFKC).toLowerCase(Locale.ROOT);
        return normalized.replaceAll("[\\s._()·ㆍ/\\-]", "");
    }

    private static String required(String value, String message, int maxLength) {
        String cleaned = clean(value);
        if (cleaned.isBlank()) throw new IllegalArgumentException(message);
        if (cleaned.length() > maxLength) throw new IllegalArgumentException("입력값은 " + maxLength + "자 이하여야 해요.");
        return cleaned;
    }

    private static String nullable(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private static String clean(String value) {
        return value == null ? "" : value.replace('\u00a0', ' ').strip();
    }

    private static String limit(String value, int maxLength) {
        String cleaned = clean(value);
        return cleaned.length() <= maxLength ? cleaned : cleaned.substring(0, maxLength);
    }

    private String safeFileName(String value) {
        String cleaned = clean(value).replace('\\', '/');
        int slash = cleaned.lastIndexOf('/');
        String fileName = slash >= 0 ? cleaned.substring(slash + 1) : cleaned;
        return limit(fileName.isBlank() ? "kcia-ingredients" : fileName, 255);
    }

    private List<String> lines(String value) {
        if (value == null || value.isBlank()) return List.of();
        return value.lines().filter(line -> !line.isBlank()).toList();
    }

    private record AliasRow(String sourceIngredientId, String alias, String normalizedAlias, String type) {
    }

    private record ReferenceMatch(String sourceId, String sourceIngredientId, String standardName, String englishName) {
    }

    private record MatchedIngredient(String ingredientId, String rawName) {
    }
}
