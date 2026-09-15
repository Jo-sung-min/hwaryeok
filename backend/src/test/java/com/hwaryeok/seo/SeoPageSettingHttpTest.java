package com.hwaryeok.seo;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.hwaryeok.user.ActivityNickname;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.datasource.url=jdbc:h2:mem:seo-page-setting-http;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"
)
class SeoPageSettingHttpTest {

    private static final String PUBLIC_PATH = "/api/v1/seo/pages";
    private static final String ADMIN_PATH = "/api/v1/admin/seo/pages";
    private static final String PRODUCTS_DESCRIPTION =
            "제품명과 브랜드뿐 아니라 주름, 모공, 트러블 같은 피부 고민으로 성분 근거가 연결된 화장품을 찾아보세요.";
    private static final List<String> DEFAULT_KEYWORDS = List.of(
            "화장품 랭킹", "성분 랭킹", "히알루론산", "세라마이드", "화장품 리뷰", "화장품 비교"
    );

    @LocalServerPort private int port;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private JwtEncoder jwtEncoder;
    @Autowired private ObjectMapper mapper;

    private final HttpClient client = HttpClient.newHttpClient();
    private final List<String> userIds = new ArrayList<>();
    private String ordinaryUserId;
    private String administratorId;
    private String ordinaryToken;
    private String administratorToken;

    @BeforeEach
    void setUp() {
        resetProductsSetting();
        ordinaryUserId = addUser("USER", "SEO 일반회원");
        administratorId = addUser("ADMIN", "SEO 관리자");
        ordinaryToken = token(ordinaryUserId, "USER");
        administratorToken = token(administratorId, "ADMIN");
    }

    @AfterEach
    void cleanUp() {
        resetProductsSetting();
        userIds.forEach(id -> jdbc.update("DELETE FROM users WHERE id = ?", id));
        userIds.clear();
    }

    @Test
    void exposesSeededSettingsPubliclyInFixedPageOrder() throws Exception {
        HttpResponse<String> response = send("GET", PUBLIC_PATH, null, null);
        assertThat(response.statusCode()).isEqualTo(200);

        JsonNode pages = mapper.readTree(response.body());
        assertThat(pages.size()).isEqualTo(13);
        assertThat(pages.get(0).get("pageKey").asString()).isEqualTo("HOME");
        assertThat(pages.get(0).get("path").asString()).isEqualTo("/");
        assertThat(pages.get(0).get("priority").decimalValue()).isEqualByComparingTo("1.00");
        assertThat(pages.get(12).get("pageKey").asString()).isEqualTo("RISING_RANKING");

        JsonNode products = mapper.readTree(send("GET", PUBLIC_PATH + "/PRODUCTS", null, null).body());
        assertThat(products.get("path").asString()).isEqualTo("/products");
        assertThat(products.get("displayName").asString()).isEqualTo("화장품 탐색");
        assertThat(products.get("title").asString()).isEqualTo("화장품 탐색 | 화력");
        assertThat(products.get("description").asString()).isEqualTo(PRODUCTS_DESCRIPTION);
        assertThat(products.get("keywords").size()).isEqualTo(6);
        assertThat(products.get("indexable").asBoolean()).isTrue();
        assertThat(products.get("includeInSitemap").asBoolean()).isTrue();
        assertThat(products.get("changeFrequency").asString()).isEqualTo("WEEKLY");
        assertThat(products.get("updatedAt").isNull()).isFalse();

        assertThat(send("GET", PUBLIC_PATH + "/UNKNOWN", null, null).statusCode()).isEqualTo(400);
    }

    @Test
    void requiresCurrentAdministratorStateAndPublishesUpdatesImmediately() throws Exception {
        assertThat(send("GET", ADMIN_PATH, null, null).statusCode()).isEqualTo(401);
        assertThat(send("GET", ADMIN_PATH, ordinaryToken, null).statusCode()).isEqualTo(403);
        assertThat(send("PUT", ADMIN_PATH + "/PRODUCTS", ordinaryToken, validRequest()).statusCode())
                .isEqualTo(403);

        HttpResponse<String> adminList = send("GET", ADMIN_PATH, administratorToken, null);
        assertThat(adminList.statusCode()).isEqualTo(200);
        assertThat(mapper.readTree(adminList.body()).size()).isEqualTo(13);

        Map<String, Object> update = validRequest();
        update.put("title", "  관리자가 정한 제품 SEO | 화력  ");
        update.put("keywords", List.of("  화장품 추천  ", "민감 피부"));
        update.put("ogImageUrl", "/seo/products.png?v=2");
        update.put("priority", new BigDecimal("0.85"));
        HttpResponse<String> updatedResponse = send("PUT", ADMIN_PATH + "/PRODUCTS", administratorToken, update);

        assertThat(updatedResponse.statusCode()).isEqualTo(200);
        JsonNode updated = mapper.readTree(updatedResponse.body());
        assertThat(updated.get("title").asString()).isEqualTo("관리자가 정한 제품 SEO | 화력");
        assertThat(updated.get("keywords").get(0).asString()).isEqualTo("화장품 추천");
        assertThat(updated.get("ogImageUrl").asString()).isEqualTo("/seo/products.png?v=2");
        assertThat(updated.get("priority").decimalValue()).isEqualByComparingTo("0.85");
        assertThat(updated.get("path").asString()).isEqualTo("/products");

        HttpResponse<String> publicResponse = send("GET", PUBLIC_PATH + "/PRODUCTS", null, null);
        assertThat(publicResponse.statusCode()).isEqualTo(200);
        assertThat(publicResponse.body())
                .contains("관리자가 정한 제품 SEO | 화력", "/seo/products.png?v=2")
                .doesNotContain(administratorId, "updatedBy");
        assertThat(jdbc.queryForObject(
                "SELECT updated_by FROM seo_page_settings WHERE page_key = 'PRODUCTS'", String.class
        )).isEqualTo(administratorId);

        jdbc.update("UPDATE users SET role = 'USER' WHERE id = ?", administratorId);
        assertThat(send("PUT", ADMIN_PATH + "/PRODUCTS", administratorToken, validRequest()).statusCode())
                .isEqualTo(403);
    }

    @Test
    void rejectsInvalidOrServerManagedSeoValuesWithoutChangingThePagePath() throws Exception {
        Map<String, Object> tooLongTitle = validRequest();
        tooLongTitle.put("title", "가".repeat(101));
        HttpResponse<String> titleResponse = send(
                "PUT", ADMIN_PATH + "/PRODUCTS", administratorToken, tooLongTitle
        );
        assertThat(titleResponse.statusCode()).isEqualTo(400);
        assertThat(titleResponse.body()).contains("VALIDATION_FAILED", "title");

        Map<String, Object> insecureImage = validRequest();
        insecureImage.put("ogImageUrl", "http://example.com/image.png");
        assertThat(send("PUT", ADMIN_PATH + "/PRODUCTS", administratorToken, insecureImage).body())
                .contains("INVALID_REQUEST", "https 주소");

        Map<String, Object> protocolRelativeImage = validRequest();
        protocolRelativeImage.put("ogImageUrl", "//example.com/image.png");
        assertThat(send("PUT", ADMIN_PATH + "/PRODUCTS", administratorToken, protocolRelativeImage).statusCode())
                .isEqualTo(400);

        Map<String, Object> backslashImage = validRequest();
        backslashImage.put("ogImageUrl", "/seo\\image.png");
        assertThat(send("PUT", ADMIN_PATH + "/PRODUCTS", administratorToken, backslashImage).statusCode())
                .isEqualTo(400);

        Map<String, Object> serverManagedPath = validRequest();
        serverManagedPath.put("path", "/changed-by-client");
        assertThat(send("PUT", ADMIN_PATH + "/PRODUCTS", administratorToken, serverManagedPath).body())
                .contains("INVALID_REQUEST", "페이지 경로와 화면 이름은 변경할 수 없어요.");

        Map<String, Object> noIndexInSitemap = validRequest();
        noIndexInSitemap.put("indexable", false);
        assertThat(send("PUT", ADMIN_PATH + "/PRODUCTS", administratorToken, noIndexInSitemap).body())
                .contains("INVALID_REQUEST", "사이트맵에 포함할 수 없어요.");

        Map<String, Object> excessivePriority = validRequest();
        excessivePriority.put("priority", new BigDecimal("1.01"));
        assertThat(send("PUT", ADMIN_PATH + "/PRODUCTS", administratorToken, excessivePriority).body())
                .contains("VALIDATION_FAILED", "priority");

        Map<String, Object> duplicateKeywords = validRequest();
        duplicateKeywords.put("keywords", List.of("성분", "  성분  "));
        assertThat(send("PUT", ADMIN_PATH + "/PRODUCTS", administratorToken, duplicateKeywords).body())
                .contains("INVALID_REQUEST", "한 번만 입력");

        Map<String, Object> unsupportedFrequency = validRequest();
        unsupportedFrequency.put("changeFrequency", "SOMETIMES");
        assertThat(send("PUT", ADMIN_PATH + "/PRODUCTS", administratorToken, unsupportedFrequency).body())
                .contains("MALFORMED_REQUEST");

        JsonNode unchanged = mapper.readTree(send("GET", PUBLIC_PATH + "/PRODUCTS", null, null).body());
        assertThat(unchanged.get("path").asString()).isEqualTo("/products");
        assertThat(unchanged.get("title").asString()).isEqualTo("화장품 탐색 | 화력");
    }

    private Map<String, Object> validRequest() {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("title", "제품 SEO 제목 | 화력");
        request.put("description", "검색 결과에 표시할 제품 탐색 페이지 설명입니다.");
        request.put("keywords", List.of("화장품 탐색", "화장품 비교"));
        request.put("indexable", true);
        request.put("followLinks", true);
        request.put("ogTitle", "제품 SEO Open Graph 제목 | 화력");
        request.put("ogDescription", "공유 카드에 표시할 제품 탐색 페이지 설명입니다.");
        request.put("ogImageUrl", "https://cdn.example.com/seo/products.png");
        request.put("includeInSitemap", true);
        request.put("changeFrequency", "WEEKLY");
        request.put("priority", new BigDecimal("0.80"));
        return request;
    }

    private String addUser(String role, String nicknamePrefix) {
        String id = UUID.randomUUID().toString();
        String nickname = nicknamePrefix + " " + id.substring(0, 6);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status)
                VALUES (?, ?, NULL, ?, ?, ?, 'ACTIVE')
                """, id, id + "@example.com", nickname,
                ActivityNickname.key(ActivityNickname.normalize(nickname)), role);
        userIds.add(id);
        return id;
    }

    private String token(String userId, String role) {
        Instant now = Instant.now();
        return jwtEncoder.encode(JwtEncoderParameters.from(JwtClaimsSet.builder()
                .issuer("hwaryeok-api")
                .subject(userId)
                .issuedAt(now)
                .expiresAt(now.plusSeconds(120))
                .id(UUID.randomUUID().toString())
                .claim("role", role)
                .claim("auth_method", "password")
                .claim("token_type", "access")
                .build())).getTokenValue();
    }

    private HttpResponse<String> send(String method, String path, String token, Object body) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (token != null) builder.header("Authorization", "Bearer " + token);
        HttpRequest.BodyPublisher publisher = HttpRequest.BodyPublishers.noBody();
        if (body != null) {
            builder.header("Content-Type", "application/json");
            publisher = HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body));
        }
        return client.send(builder.method(method, publisher).build(), HttpResponse.BodyHandlers.ofString());
    }

    private void resetProductsSetting() {
        jdbc.update("DELETE FROM seo_page_keywords WHERE page_key = 'PRODUCTS'");
        for (int index = 0; index < DEFAULT_KEYWORDS.size(); index++) {
            jdbc.update("""
                    INSERT INTO seo_page_keywords (page_key, display_order, keyword)
                    VALUES ('PRODUCTS', ?, ?)
                    """, index, DEFAULT_KEYWORDS.get(index));
        }
        jdbc.update("""
                UPDATE seo_page_settings
                SET title = '화장품 탐색 | 화력',
                    description = ?,
                    indexable = TRUE,
                    follow_links = TRUE,
                    og_title = '화장품 탐색 | 화력',
                    og_description = ?,
                    og_image_url = '/hero-watercolor.png',
                    include_in_sitemap = TRUE,
                    sitemap_change_frequency = 'WEEKLY',
                    sitemap_priority = 0.70,
                    updated_by = NULL,
                    updated_at = created_at
                WHERE page_key = 'PRODUCTS'
                """, PRODUCTS_DESCRIPTION, PRODUCTS_DESCRIPTION);
    }
}
