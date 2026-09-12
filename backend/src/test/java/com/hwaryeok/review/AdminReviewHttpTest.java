package com.hwaryeok.review;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.datasource.url=jdbc:h2:mem:admin-review-http;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
class AdminReviewHttpTest {

    @LocalServerPort private int port;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private JwtEncoder jwtEncoder;
    @Autowired private ObjectMapper mapper;

    private final HttpClient client = HttpClient.newHttpClient();
    private final List<String> users = new ArrayList<>();
    private String productId;
    private String reviewId;
    private String sampleId;
    private String authorId;
    private String voterId;
    private String userToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        productId = "admin-review-" + UUID.randomUUID().toString().substring(0, 8);
        reviewId = UUID.randomUUID().toString();
        sampleId = "sample:" + productId;
        authorId = addUser("USER", "관리 대상 리뷰어");
        voterId = addUser("USER", "리뷰 평가자");
        String ordinaryUserId = addUser("USER", "일반 회원");
        String adminId = addUser("ADMIN", "리뷰 관리자");
        userToken = token(ordinaryUserId, "USER");
        adminToken = token(adminId, "ADMIN");

        jdbc.update("""
                INSERT INTO products
                    (id, brand, name, category, base_score, benefit, sub_benefit, price, tone, publication_status)
                VALUES (?, 'AdminFindBrand', '관리 리뷰 검색 제품', '토너', 80, '보습', '진정', 10000, 'rose', 'PUBLISHED')
                """, productId);
        jdbc.update("""
                INSERT INTO product_sample_reviews
                    (id, product_id, total_score, content, skin_type, usage_period, repurchase_yn)
                VALUES (?, ?, 80, '관리자 화면에서 확인할 샘플 리뷰입니다.', '민감', 'ONE_MONTH', TRUE)
                """, sampleId, productId);
        jdbc.update("""
                INSERT INTO reviews
                    (id, product_id, user_id, template_id, total_score, content, skin_type, usage_period, repurchase_yn)
                VALUES (?, ?, ?, 'review-toner-v1', 90, '관리자 검색과 삭제를 확인할 사용자 리뷰입니다.',
                        '민감', 'ONE_MONTH', TRUE)
                """, reviewId, productId, authorId);
        jdbc.update("""
                INSERT INTO review_scores (id, review_id, criteria_id, score)
                VALUES (?, ?, 'toner-moisture', 5)
                """, UUID.randomUUID().toString(), reviewId);
        jdbc.update("""
                INSERT INTO review_firepower_ratings (review_id, voter_id, score)
                VALUES (?, ?, 5)
                """, reviewId, voterId);
    }

    @AfterEach
    void cleanUp() {
        if (productId != null) jdbc.update("DELETE FROM products WHERE id = ?", productId);
        users.forEach(id -> jdbc.update("DELETE FROM users WHERE id = ?", id));
        users.clear();
    }

    @Test
    void onlyAdminsCanSearchAndFilterUnifiedUserAndSampleReviews() throws Exception {
        assertThat(send("GET", "/api/v1/admin/reviews", null).statusCode()).isEqualTo(401);
        assertThat(send("GET", "/api/v1/admin/reviews", userToken).statusCode()).isEqualTo(403);

        HttpResponse<String> userResponse = send(
                "GET", "/api/v1/admin/reviews?kind=USER&q=AdminFindBrand&page=0&size=1", adminToken
        );
        assertThat(userResponse.statusCode()).isEqualTo(200);
        JsonNode userPage = mapper.readTree(userResponse.body());
        assertThat(userPage.get("totalElements").asLong()).isEqualTo(1);
        JsonNode review = userPage.get("content").get(0);
        assertThat(review.get("id").asString()).isEqualTo(reviewId);
        assertThat(review.get("kind").asString()).isEqualTo("USER");
        assertThat(review.get("sampleReview").asBoolean()).isFalse();
        assertThat(review.get("product").get("id").asString()).isEqualTo(productId);
        assertThat(review.get("author").get("id").asString()).isEqualTo(authorId);
        assertThat(review.get("communityAverageScore").asDouble()).isEqualTo(5.0);
        assertThat(review.get("communityRatingCount").asLong()).isEqualTo(1);

        JsonNode samplePage = mapper.readTree(send(
                "GET", "/api/v1/admin/reviews?kind=SAMPLE&q=AdminFindBrand", adminToken
        ).body());
        assertThat(samplePage.get("totalElements").asLong()).isEqualTo(1);
        JsonNode sample = samplePage.get("content").get(0);
        assertThat(sample.get("id").asString()).isEqualTo(sampleId);
        assertThat(sample.get("author").get("id").isNull()).isTrue();
        assertThat(sample.get("author").get("nickname").asString()).isEqualTo("화력 샘플");
        assertThat(sample.get("communityRatingCount").asLong()).isZero();

        assertThat(send("GET", "/api/v1/admin/reviews?kind=UNKNOWN", adminToken).statusCode()).isEqualTo(400);
        assertThat(send("GET", "/api/v1/admin/reviews?size=51", adminToken).statusCode()).isEqualTo(400);
    }

    @Test
    void adminDeletionPhysicallyRemovesReviewsAndTheirDependentRows() throws Exception {
        assertThat(send("DELETE", "/api/v1/admin/reviews/" + reviewId, userToken).statusCode()).isEqualTo(403);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reviews WHERE id = ?", Long.class, reviewId)).isEqualTo(1);

        assertThat(send("DELETE", "/api/v1/admin/reviews/" + reviewId, adminToken).statusCode()).isEqualTo(204);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reviews WHERE id = ?", Long.class, reviewId)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM review_scores WHERE review_id = ?", Long.class, reviewId)).isZero();
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM review_firepower_ratings WHERE review_id = ?", Long.class, reviewId
        )).isZero();

        JsonNode publicSummary = mapper.readTree(send(
                "GET", "/api/v1/products/" + productId + "/reviews", null
        ).body());
        assertThat(publicSummary.get("reviewCount").asLong()).isZero();
        assertThat(publicSummary.get("reviews").get(0).get("id").asString()).isEqualTo(sampleId);

        assertThat(send("DELETE", "/api/v1/admin/reviews/" + sampleId, adminToken).statusCode()).isEqualTo(204);
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM product_sample_reviews WHERE id = ?", Long.class, sampleId
        )).isZero();
        assertThat(send("DELETE", "/api/v1/admin/reviews/" + sampleId, adminToken).statusCode()).isEqualTo(404);
    }

    private String addUser(String role, String nickname) {
        String id = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status)
                VALUES (?, ?, NULL, ?, ?, ?, 'ACTIVE')
                """, id, id + "@example.com", nickname,
                ActivityNickname.key(ActivityNickname.normalize(nickname)), role);
        users.add(id);
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

    private HttpResponse<String> send(String method, String path, String token) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (token != null) builder.header("Authorization", "Bearer " + token);
        return client.send(builder.method(method, HttpRequest.BodyPublishers.noBody()).build(),
                HttpResponse.BodyHandlers.ofString());
    }
}
