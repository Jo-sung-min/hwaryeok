package com.hwaryeok.datasource;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletionService;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorCompletionService;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
class MfdsApiSyncService {

    private static final int PAGE_SIZE = 500;
    private static final int MAX_PAGES = 5_000;
    private static final int CONCURRENT_REQUESTS = 4;
    private static final String FUNCTIONAL_SOURCE = "MFDS_FUNCTIONAL";
    private static final String RESTRICTED_SOURCE = "MFDS_RESTRICTED";

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final TransactionTemplate transactionTemplate;
    private final String serviceKey;
    private final String functionalProductsUrl;
    private final String restrictedIngredientsUrl;

    MfdsApiSyncService(
            JdbcTemplate jdbc,
            ObjectMapper objectMapper,
            PlatformTransactionManager transactionManager,
            @Value("${app.data-sources.mfds.service-key:}") String serviceKey,
            @Value("${app.data-sources.mfds.functional-products-url:}") String functionalProductsUrl,
            @Value("${app.data-sources.mfds.restricted-ingredients-url:}") String restrictedIngredientsUrl
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.serviceKey = clean(serviceKey);
        this.functionalProductsUrl = clean(functionalProductsUrl);
        this.restrictedIngredientsUrl = clean(restrictedIngredientsUrl);
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    MfdsSyncResponse sync() {
        if (serviceKey.isBlank()) {
            throw new IllegalArgumentException("MFDS_API_SERVICE_KEY가 설정되지 않았어요. 공공데이터포털에서 발급한 일반 인증키를 등록해 주세요.");
        }
        List<DataImportResultResponse> results = new ArrayList<>();
        if (functionalProductsUrl.isBlank()) {
            results.add(configurationRequired(FUNCTIONAL_SOURCE, "MFDS_FUNCTIONAL_COSMETICS_API_URL을 설정해 주세요."));
        } else {
            results.add(syncFunctionalProducts());
        }
        if (restrictedIngredientsUrl.isBlank()) {
            results.add(configurationRequired(RESTRICTED_SOURCE, "MFDS_RESTRICTED_INGREDIENTS_API_URL을 설정해 주세요."));
        } else {
            results.add(syncRestrictedIngredients());
        }
        return new MfdsSyncResponse(List.copyOf(results));
    }

    private DataImportResultResponse syncFunctionalProducts() {
        return syncPaged(
                FUNCTIONAL_SOURCE,
                functionalProductsUrl,
                "식약처 기능성화장품 보고품목",
                this::toProduct,
                MfdsProductRow::reportId,
                this::upsertProducts,
                this::refreshAutoMatches
        );
    }

    private void upsertProducts(List<MfdsProductRow> rows) {
        jdbc.batchUpdate("""
                INSERT INTO mfds_cosmetic_products (
                    report_id, product_name, normalized_product_name, company_name,
                    manufacturer_name, functional_types, report_date, source_url, collected_at, raw_payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (report_id) DO UPDATE SET
                    product_name = EXCLUDED.product_name,
                    normalized_product_name = EXCLUDED.normalized_product_name,
                    company_name = EXCLUDED.company_name,
                    manufacturer_name = EXCLUDED.manufacturer_name,
                    functional_types = EXCLUDED.functional_types,
                    report_date = EXCLUDED.report_date,
                    source_url = EXCLUDED.source_url,
                    collected_at = EXCLUDED.collected_at,
                    raw_payload = EXCLUDED.raw_payload
                """, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement statement, int index) throws java.sql.SQLException {
                MfdsProductRow row = rows.get(index);
                statement.setString(1, row.reportId());
                statement.setString(2, row.productName());
                statement.setString(3, row.normalizedProductName());
                statement.setString(4, nullable(row.companyName()));
                statement.setString(5, nullable(row.manufacturerName()));
                statement.setString(6, nullable(row.functionalTypes()));
                statement.setObject(7, row.reportDate());
                statement.setString(8, functionalProductsUrl);
                statement.setTimestamp(9, Timestamp.from(Instant.now()));
                statement.setString(10, row.rawPayload());
            }

            @Override
            public int getBatchSize() { return rows.size(); }
        });
    }

    private DataImportResultResponse syncRestrictedIngredients() {
        return syncPaged(
                RESTRICTED_SOURCE,
                restrictedIngredientsUrl,
                "식약처 사용제한 원료",
                this::toRegulation,
                MfdsRegulationRow::sourceRecordId,
                this::upsertRegulations,
                () -> { }
        );
    }

    private void upsertRegulations(List<MfdsRegulationRow> rows) {
        jdbc.batchUpdate("""
                INSERT INTO mfds_ingredient_regulations (
                    source_record_id, standard_name, normalized_name, english_name, cas_no,
                    restriction_type, restriction_text, proviso, source_url, collected_at, raw_payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (source_record_id) DO UPDATE SET
                    standard_name = EXCLUDED.standard_name,
                    normalized_name = EXCLUDED.normalized_name,
                    english_name = EXCLUDED.english_name,
                    cas_no = EXCLUDED.cas_no,
                    restriction_type = EXCLUDED.restriction_type,
                    restriction_text = EXCLUDED.restriction_text,
                    proviso = EXCLUDED.proviso,
                    source_url = EXCLUDED.source_url,
                    collected_at = EXCLUDED.collected_at,
                    raw_payload = EXCLUDED.raw_payload
                """, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement statement, int index) throws java.sql.SQLException {
                MfdsRegulationRow row = rows.get(index);
                statement.setString(1, row.sourceRecordId());
                statement.setString(2, row.standardName());
                statement.setString(3, row.normalizedName());
                statement.setString(4, nullable(row.englishName()));
                statement.setString(5, nullable(row.casNo()));
                statement.setString(6, nullable(row.restrictionType()));
                statement.setString(7, nullable(row.restrictionText()));
                statement.setString(8, nullable(row.proviso()));
                statement.setString(9, restrictedIngredientsUrl);
                statement.setTimestamp(10, Timestamp.from(Instant.now()));
                statement.setString(11, row.rawPayload());
            }

            @Override
            public int getBatchSize() { return rows.size(); }
        });
    }

    private <T> DataImportResultResponse syncPaged(
            String sourceId,
            String endpoint,
            String displayName,
            Function<JsonNode, T> mapper,
            Function<T, String> keyExtractor,
            Consumer<List<T>> upsert,
            Runnable afterSuccess
    ) {
        validateEndpoint(endpoint);
        String runId = transactionTemplate.execute(status -> startRun(sourceId));
        if (runId == null) throw new IllegalStateException("식약처 동기화 이력을 시작하지 못했어요.");

        ImportStats stats = new ImportStats();
        Set<String> seenRecordIds = new HashSet<>();
        try {
            FetchedPage firstPage = fetchDataPage(endpoint, 1);
            persistPage(firstPage, mapper, keyExtractor, upsert, seenRecordIds, stats);

            if (firstPage.totalCount() >= 0) {
                int totalPages = Math.max(1, (firstPage.totalCount() + PAGE_SIZE - 1) / PAGE_SIZE);
                if (totalPages > MAX_PAGES) {
                    throw new IllegalArgumentException("식약처 데이터가 안전한 동기화 한도를 초과했어요. 관리자에게 페이지 한도 조정을 요청해 주세요.");
                }
                fetchKnownPages(endpoint, totalPages, mapper, keyExtractor, upsert, seenRecordIds, stats);
                if (stats.recordsRead < firstPage.totalCount()) {
                    throw new IllegalArgumentException("식약처 API 전체 데이터를 받지 못했어요. 응답 건수를 확인한 뒤 다시 시도해 주세요.");
                }
            } else {
                fetchUnknownPages(
                        endpoint, firstPage.items().size(), mapper, keyExtractor, upsert, seenRecordIds, stats
                );
            }

            transactionTemplate.executeWithoutResult(status -> {
                afterSuccess.run();
                finishRun(runId, stats.recordsRead, stats.recordsUpserted, stats.recordsSkipped);
            });
            return new DataImportResultResponse(
                    sourceId,
                    "SUCCEEDED",
                    stats.recordsRead,
                    stats.recordsUpserted,
                    stats.recordsSkipped,
                    displayName + " " + stats.recordsUpserted + "건을 동기화했어요."
            );
        } catch (RuntimeException exception) {
            markRunFailed(runId, stats, exception);
            throw exception;
        }
    }

    private <T> void fetchKnownPages(
            String endpoint,
            int totalPages,
            Function<JsonNode, T> mapper,
            Function<T, String> keyExtractor,
            Consumer<List<T>> upsert,
            Set<String> seenRecordIds,
            ImportStats stats
    ) {
        if (totalPages <= 1) return;
        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_REQUESTS);
        CompletionService<FetchedPage> completionService = new ExecutorCompletionService<>(executor);
        try {
            for (int page = 2; page <= totalPages; page++) {
                int pageNumber = page;
                completionService.submit(() -> fetchDataPage(endpoint, pageNumber));
            }
            for (int completed = 1; completed < totalPages; completed++) {
                persistPage(completionService.take().get(), mapper, keyExtractor, upsert, seenRecordIds, stats);
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalArgumentException("식약처 API 동기화가 중단됐어요.");
        } catch (ExecutionException exception) {
            Throwable cause = exception.getCause();
            if (cause instanceof RuntimeException runtimeException) throw runtimeException;
            throw new IllegalArgumentException("식약처 API 페이지를 처리하지 못했어요.");
        } finally {
            executor.shutdownNow();
        }
    }

    private <T> void fetchUnknownPages(
            String endpoint,
            int firstPageSize,
            Function<JsonNode, T> mapper,
            Function<T, String> keyExtractor,
            Consumer<List<T>> upsert,
            Set<String> seenRecordIds,
            ImportStats stats
    ) {
        int previousPageSize = firstPageSize;
        for (int page = 2; previousPageSize == PAGE_SIZE && page <= MAX_PAGES; page++) {
            FetchedPage fetchedPage = fetchDataPage(endpoint, page);
            previousPageSize = fetchedPage.items().size();
            persistPage(fetchedPage, mapper, keyExtractor, upsert, seenRecordIds, stats);
        }
        if (previousPageSize == PAGE_SIZE) {
            throw new IllegalArgumentException("식약처 데이터가 안전한 동기화 한도를 초과했어요. 관리자에게 페이지 한도 조정을 요청해 주세요.");
        }
    }

    private <T> void persistPage(
            FetchedPage fetchedPage,
            Function<JsonNode, T> mapper,
            Function<T, String> keyExtractor,
            Consumer<List<T>> upsert,
            Set<String> seenRecordIds,
            ImportStats stats
    ) {
        List<T> rows = new ArrayList<>();
        for (JsonNode item : fetchedPage.items()) {
            T row = mapper.apply(item);
            if (row != null && seenRecordIds.add(keyExtractor.apply(row))) rows.add(row);
        }
        if (!rows.isEmpty()) {
            transactionTemplate.executeWithoutResult(status -> upsert.accept(rows));
        }
        stats.add(fetchedPage.items().size(), rows.size());
    }

    private FetchedPage fetchDataPage(String endpoint, int page) {
        JsonNode root = fetchPage(endpoint, page);
        String errorCode = firstText(root, "resultCode", "RESULT_CODE", "code");
        if (!errorCode.isBlank() && !List.of("00", "0", "200", "NORMAL_SERVICE").contains(errorCode)) {
            String message = firstText(root, "resultMsg", "RESULT_MSG", "message");
            throw new IllegalArgumentException("식약처 API가 요청을 거절했어요: " + (message.isBlank() ? errorCode : message));
        }
        JsonNode itemsNode = locateItems(root);
        List<JsonNode> items = new ArrayList<>();
        if (itemsNode != null && itemsNode.isArray()) {
            for (JsonNode item : itemsNode) {
                if (item.isObject()) items.add(item);
            }
        } else if (itemsNode != null && itemsNode.isObject()) {
            items.add(itemsNode);
        }
        return new FetchedPage(List.copyOf(items), firstInt(root, "totalCount", "TOTAL_COUNT", "totalCnt"));
    }

    private JsonNode fetchPage(String endpoint, int page) {
        String separator = endpoint.contains("?") ? "&" : "?";
        String url = endpoint + separator
                + "serviceKey=" + URLEncoder.encode(serviceKey, StandardCharsets.UTF_8)
                + "&pageNo=" + page
                + "&numOfRows=" + PAGE_SIZE
                + "&type=json&_type=json";
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .header("Accept", "application/json")
                .GET()
                .build();
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                HttpResponse<String> response = httpClient.send(
                        request,
                        HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
                );
                boolean retryableStatus = response.statusCode() == 429 || response.statusCode() >= 500;
                if (retryableStatus && attempt < 3) {
                    pauseBeforeRetry(attempt);
                    continue;
                }
                if (response.statusCode() < 200 || response.statusCode() >= 300) {
                    throw new IllegalArgumentException("식약처 API 응답 상태를 확인해 주세요: HTTP " + response.statusCode());
                }
                String body = response.body().strip();
                if (body.startsWith("<")) {
                    throw new IllegalArgumentException("식약처 API가 XML을 반환했어요. JSON 지원 API 주소인지 확인해 주세요.");
                }
                return objectMapper.readTree(body);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalArgumentException("식약처 API 동기화가 중단됐어요.");
            } catch (java.io.IOException exception) {
                if (attempt == 3) {
                    throw new IllegalArgumentException("식약처 API에 연결하지 못했어요. API 주소와 네트워크를 확인해 주세요.");
                }
                pauseBeforeRetry(attempt);
            }
        }
        throw new IllegalArgumentException("식약처 API에 연결하지 못했어요. API 주소와 네트워크를 확인해 주세요.");
    }

    private void pauseBeforeRetry(int attempt) {
        try {
            Thread.sleep(250L * attempt);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalArgumentException("식약처 API 동기화가 중단됐어요.");
        }
    }

    private JsonNode locateItems(JsonNode root) {
        JsonNode direct = root.path("response").path("body").path("items");
        if (direct.isArray()) return direct;
        direct = direct.path("item");
        if (!direct.isMissingNode() && !direct.isNull()) return direct;
        direct = root.path("body").path("items");
        if (direct.isArray()) return direct;
        direct = direct.path("item");
        if (!direct.isMissingNode() && !direct.isNull()) return direct;
        direct = root.path("items");
        if (direct.isArray()) return direct;
        direct = direct.path("item");
        if (!direct.isMissingNode() && !direct.isNull()) return direct;
        return findFirstArray(root);
    }

    private JsonNode findFirstArray(JsonNode node) {
        if (node == null) return null;
        if (node.isArray()) return node;
        if (!node.isObject() && !node.isArray()) return null;
        for (JsonNode child : node) {
            JsonNode found = findFirstArray(child);
            if (found != null) return found;
        }
        return null;
    }

    private MfdsProductRow toProduct(JsonNode item) {
        String name = firstText(item, "PRDUCT_NM", "PRDLST_NM", "ITEM_NAME", "productName", "prductNm");
        if (name.isBlank()) return null;
        String company = firstText(item, "ENTP_NAME", "ENTRPS_NM", "BSSH_NM", "companyName", "entrpsNm");
        String reportId = firstText(
                item, "COSMETIC_REPORT_SEQ", "RPRT_NO", "PRDLST_REPORT_NO", "ITEM_SEQ", "reportNo", "rprtNo"
        );
        if (reportId.isBlank()) reportId = hashId(name + "|" + company);
        return new MfdsProductRow(
                limit(reportId, 120),
                limit(name, 500),
                limit(CosmeticDataPipelineService.normalizeName(name), 500),
                limit(firstNonBlank(company, firstText(item, "RSPNSBLTY_DISTB_ENTRPS_NM", "responsibleCompany")), 300),
                limit(firstText(item, "MANUF_NAME", "MNFTURER_NM", "MNFTR_NM", "manufacturerName"), 300),
                limit(firstText(
                        item, "EE_NAME", "COSMETIC_STD_NAME", "COSMETIC_TARGET_FLAG_NAME",
                        "PRIMARY_FNCLTY", "FNCLTY_NM", "functionalTypes", "mainFunction"
                ), 1000),
                parseDate(firstText(item, "RPRT_DE", "REPORT_DATE", "reportDate", "rprtDe")),
                item.toString()
        );
    }

    private MfdsRegulationRow toRegulation(JsonNode item) {
        String name = firstText(
                item, "INGR_STD_NAME", "STD_NM", "STANDARD_NM", "INGR_NM", "MTRAL_NM", "standardName", "stdNm"
        );
        if (name.isBlank()) return null;
        String cas = firstText(item, "CAS_NO", "CASNo", "casNo");
        String id = firstText(item, "SN", "SEQ", "INGR_CODE", "MTRAL_CODE", "sourceRecordId");
        String restrictionType = firstText(item, "REGULATE_TYPE", "RSTRC_NM", "INGR_TYPE", "restrictionType");
        String restrictionText = firstText(item, "LIMIT_COND", "RSTRC_CN", "RESTRICTION", "restrictionText");
        String proviso = firstText(item, "PROVIS_ATRCL", "PROVISO", "RMK", "DANSEO", "proviso");
        if (id.isBlank()) {
            id = hashId(String.join("|",
                    name,
                    cas,
                    firstText(item, "COUNTRY_NAME"),
                    restrictionType,
                    firstText(item, "NOTICE_INGR_NAME"),
                    restrictionText,
                    proviso
            ));
        }
        return new MfdsRegulationRow(
                limit(id, 120),
                limit(name, 500),
                limit(CosmeticDataPipelineService.normalizeName(name), 500),
                limit(firstText(item, "INGR_ENG_NAME", "ENG_NM", "ENGLISH_NM", "englishName", "engNm"), 500),
                limit(cas, 200),
                limit(restrictionType, 200),
                limit(restrictionText, 2000),
                limit(proviso, 2000),
                item.toString()
        );
    }

    private void refreshAutoMatches() {
        jdbc.update("DELETE FROM mfds_product_matches WHERE match_type = 'AUTO_EXACT'");
        jdbc.update("""
                INSERT INTO mfds_product_matches (product_id, report_id, match_type, confidence, matched_at)
                SELECT
                    product.id,
                    mfds.report_id,
                    'AUTO_EXACT',
                    CASE
                        WHEN normalized_brand.value <> ''
                            AND normalized_company.value LIKE '%' || normalized_brand.value || '%'
                        THEN 95
                        ELSE 85
                    END,
                    CURRENT_TIMESTAMP
                FROM products product
                CROSS JOIN LATERAL (
                    SELECT LOWER(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(product.name, ''), ' ', ''), '-', ''), '·', ''), '/', '')) AS value
                ) normalized_product_name
                CROSS JOIN LATERAL (
                    SELECT LOWER(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(product.brand, ''), ' ', ''), '-', ''), '·', ''), '/', '')) AS value
                ) normalized_brand
                JOIN mfds_cosmetic_products mfds
                    ON mfds.normalized_product_name = normalized_product_name.value
                CROSS JOIN LATERAL (
                    SELECT LOWER(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(mfds.company_name, ''), ' ', ''), '-', ''), '·', ''), '/', '')) AS value
                ) normalized_company
                ON CONFLICT (product_id, report_id) DO UPDATE SET
                    confidence = EXCLUDED.confidence,
                    matched_at = EXCLUDED.matched_at
                """);
    }

    private String startRun(String sourceId) {
        String id = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO cosmetic_ingestion_runs (id, source_id, status, started_at)
                VALUES (?, ?, 'RUNNING', ?)
                """, id, sourceId, Timestamp.from(Instant.now()));
        return id;
    }

    private void finishRun(String id, int read, int upserted, int skipped) {
        jdbc.update("""
                UPDATE cosmetic_ingestion_runs
                SET status = 'SUCCEEDED', records_read = ?, records_upserted = ?, records_skipped = ?, finished_at = ?
                WHERE id = ?
                """, read, upserted, skipped, Timestamp.from(Instant.now()), id);
    }

    private void markRunFailed(String id, ImportStats stats, RuntimeException exception) {
        String message = limit(exception.getMessage(), 700);
        try {
            transactionTemplate.executeWithoutResult(status -> jdbc.update("""
                    UPDATE cosmetic_ingestion_runs
                    SET status = 'FAILED', records_read = ?, records_upserted = ?, records_skipped = ?,
                        error_message = ?, finished_at = ?
                    WHERE id = ?
                    """,
                    stats.recordsRead,
                    stats.recordsUpserted,
                    stats.recordsSkipped,
                    message.isBlank() ? "알 수 없는 동기화 오류" : message,
                    Timestamp.from(Instant.now()),
                    id
            ));
        } catch (RuntimeException ignored) {
            // 원래 동기화 오류를 우선 전달합니다.
        }
    }

    private DataImportResultResponse configurationRequired(String sourceId, String message) {
        return new DataImportResultResponse(sourceId, "CONFIGURATION_REQUIRED", 0, 0, 0, message);
    }

    private void validateEndpoint(String value) {
        URI uri;
        try {
            uri = URI.create(value);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("식약처 API 주소 형식을 확인해 주세요.");
        }
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        boolean officialHost = host.equals("apis.data.go.kr")
                || host.endsWith(".mfds.go.kr")
                || host.equals("foodsafetykorea.go.kr")
                || host.endsWith(".foodsafetykorea.go.kr");
        if (!"https".equalsIgnoreCase(uri.getScheme()) || !officialHost || uri.getUserInfo() != null) {
            throw new IllegalArgumentException("식약처 API 주소는 공공데이터포털 또는 식약처의 https 주소만 사용할 수 있어요.");
        }
        String query = uri.getRawQuery() == null ? "" : uri.getRawQuery().toLowerCase(Locale.ROOT);
        if (query.matches("(^|.*&)servicekey=.*")) {
            throw new IllegalArgumentException("식약처 API 주소에는 인증키를 넣지 말고 MFDS_API_SERVICE_KEY에 따로 설정해 주세요.");
        }
    }

    private String firstText(JsonNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode value = findField(node, fieldName);
            if (value != null && !value.isObject() && !value.isArray() && !value.isMissingNode() && !value.isNull()) {
                String text = clean(value.asString());
                if (!text.isBlank()) return text;
            }
        }
        return "";
    }

    private JsonNode findField(JsonNode node, String fieldName) {
        if (node == null) return null;
        if (node.isObject()) {
            JsonNode direct = node.get(fieldName);
            if (direct != null) return direct;
        }
        if (!node.isObject() && !node.isArray()) return null;
        for (JsonNode child : node) {
            JsonNode found = findField(child, fieldName);
            if (found != null) return found;
        }
        return null;
    }

    private int firstInt(JsonNode node, String... fieldNames) {
        String value = firstText(node, fieldNames);
        try {
            return value.isBlank() ? -1 : Integer.parseInt(value.replace(",", ""));
        } catch (NumberFormatException exception) {
            return -1;
        }
    }

    private LocalDate parseDate(String value) {
        String digits = clean(value).replaceAll("[^0-9]", "");
        if (digits.length() < 8) return null;
        try {
            return LocalDate.parse(digits.substring(0, 8), DateTimeFormatter.BASIC_ISO_DATE);
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String hashId(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return "generated-" + HexFormat.of().formatHex(digest, 0, 16);
        } catch (Exception exception) {
            throw new IllegalStateException("식약처 레코드 식별자를 만들지 못했어요.");
        }
    }

    private static String firstNonBlank(String first, String second) {
        return clean(first).isBlank() ? clean(second) : clean(first);
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

    private record MfdsProductRow(
            String reportId,
            String productName,
            String normalizedProductName,
            String companyName,
            String manufacturerName,
            String functionalTypes,
            LocalDate reportDate,
            String rawPayload
    ) {
    }

    private record MfdsRegulationRow(
            String sourceRecordId,
            String standardName,
            String normalizedName,
            String englishName,
            String casNo,
            String restrictionType,
            String restrictionText,
            String proviso,
            String rawPayload
    ) {
    }

    private record FetchedPage(List<JsonNode> items, int totalCount) {
    }

    private static final class ImportStats {
        private int recordsRead;
        private int recordsUpserted;
        private int recordsSkipped;

        private void add(int read, int upserted) {
            recordsRead += read;
            recordsUpserted += upserted;
            recordsSkipped += read - upserted;
        }
    }
}
