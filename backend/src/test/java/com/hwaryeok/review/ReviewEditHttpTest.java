package com.hwaryeok.review;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
        properties = "spring.datasource.url=jdbc:h2:mem:review-edit-http;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
class ReviewEditHttpTest {

    private static final List<String> CRITERIA = List.of(
            "moisture", "spread", "absorption", "lasting",
            "freshness", "low-irritation", "ingredient", "price"
    );

    @LocalServerPort private int port;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private JwtEncoder jwtEncoder;
    @Autowired private ObjectMapper mapper;

    private final HttpClient client = HttpClient.newHttpClient();
    private final List<String> users = new ArrayList<>();
    private String productId;
    private String reviewId;
    private String authorId;
    private String voterId;
    private String authorToken;
    private String otherToken;
    private String newerTemplateId;
    private String newerCriterionId;
    private Instant originalCreatedAt;

    @BeforeEach
    void setUp() {
        productId = "review-edit-" + UUID.randomUUID().toString().substring(0, 8);
        reviewId = UUID.randomUUID().toString();
        authorId = addUser("리뷰 수정 작성자");
        voterId = addUser("기존 화력 평가자");
        String otherId = addUser("다른 사용자");
        authorToken = token(authorId);
        otherToken = token(otherId);
        originalCreatedAt = Instant.now().minusSeconds(300).truncatedTo(ChronoUnit.MICROS);

        jdbc.update("""
                INSERT INTO products
                    (id, brand, name, category, base_score, benefit, sub_benefit, price, tone, publication_status)
                VALUES (?, 'ReviewEditBrand', '수정 테스트 수분 크림', '크림', 80, '보습', '진정', 19000, 'rose', 'PUBLISHED')
                """, productId);
        jdbc.update("""
                INSERT INTO reviews
                    (id, product_id, user_id, template_id, total_score, content, skin_type, usage_period,
                     repurchase_yn, created_at, updated_at)
                VALUES (?, ?, ?, 'review-moisturizer-v1', 60, '수정하기 전에 등록해 둔 열 자 이상의 리뷰입니다.',
                        '건성', 'ONE_MONTH', TRUE, ?, ?)
                """, reviewId, productId, authorId, Timestamp.from(originalCreatedAt), Timestamp.from(originalCreatedAt));
        CRITERIA.forEach(criteriaId -> jdbc.update("""
                INSERT INTO review_scores (id, review_id, criteria_id, score, created_at)
                VALUES (?, ?, ?, 3, ?)
                """, UUID.randomUUID().toString(), reviewId, criteriaId, Timestamp.from(originalCreatedAt)));
        jdbc.update("""
                INSERT INTO review_firepower_ratings (review_id, voter_id, score)
                VALUES (?, ?, 5)
                """, reviewId, voterId);
    }

    @AfterEach
    void cleanUp() {
        if (productId != null) jdbc.update("DELETE FROM products WHERE id = ?", productId);
        if (newerCriterionId != null) jdbc.update("DELETE FROM review_criteria WHERE id = ?", newerCriterionId);
        if (newerTemplateId != null) jdbc.update("DELETE FROM review_templates WHERE id = ?", newerTemplateId);
        users.forEach(id -> jdbc.update("DELETE FROM users WHERE id = ?", id));
        users.clear();
    }

    @Test
    void authenticatedSummaryIncludesOnlyTheViewersEditableReview() throws Exception {
        JsonNode anonymous = mapper.readTree(send("GET", reviewsPath(), null, null).body());
        assertThat(anonymous.get("viewerHasReviewed").asBoolean()).isFalse();
        assertThat(anonymous.get("viewerReview").isNull()).isTrue();
        assertThat(anonymous.get("viewerReviewCriteria").isNull()).isTrue();

        JsonNode owner = mapper.readTree(send("GET", reviewsPath(), authorToken, null).body());
        assertThat(owner.get("viewerHasReviewed").asBoolean()).isTrue();
        assertThat(owner.get("viewerReview").get("id").asString()).isEqualTo(reviewId);
        assertThat(owner.get("viewerReview").get("scores").size()).isEqualTo(CRITERIA.size());
        assertThat(owner.get("viewerReview").get("updatedAt").isNull()).isFalse();
        assertThat(owner.get("viewerReviewCriteria").get("templateId").asString())
                .isEqualTo("review-moisturizer-v1");
        assertThat(owner.get("viewerReviewCriteria").get("criteria").size()).isEqualTo(CRITERIA.size());

        JsonNode other = mapper.readTree(send("GET", reviewsPath(), otherToken, null).body());
        assertThat(other.get("viewerHasReviewed").asBoolean()).isFalse();
        assertThat(other.get("viewerReview").isNull()).isTrue();
        assertThat(other.get("viewerReviewCriteria").isNull()).isTrue();
    }

    @Test
    void ownerCanReplaceReviewWhileIdentityCreationTimeAndFirepowerRemain() throws Exception {
        newerTemplateId = "review-edit-newer-" + UUID.randomUUID().toString().substring(0, 8);
        newerCriterionId = "review-edit-new-criterion-" + UUID.randomUUID().toString().substring(0, 8);
        jdbc.update("""
                INSERT INTO review_templates (id, category_id, version, use_yn)
                VALUES (?, 'MOISTURIZER', 99, TRUE)
                """, newerTemplateId);
        jdbc.update("""
                INSERT INTO review_criteria
                    (id, template_id, code, name, description, weight, display_order, use_yn)
                VALUES (?, ?, 'NEW_CRITERION', '새 평가 기준', '기존 리뷰에는 적용하지 않는 새 기준입니다.', 1, 1, TRUE)
                """, newerCriterionId, newerTemplateId);

        assertThat(send("PUT", reviewsPath() + "/me", null, updatePayload(1)).statusCode()).isEqualTo(401);

        HttpResponse<String> response = send("PUT", reviewsPath() + "/me", authorToken, updatePayload(1));
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode updated = mapper.readTree(response.body());
        assertThat(updated.get("id").asString()).isEqualTo(reviewId);
        assertThat(updated.get("content").asString()).isEqualTo("수정한 뒤 저장한 충분히 구체적인 사용 후기입니다.");
        assertThat(updated.get("skinType").asString()).isEqualTo("지성");
        assertThat(updated.get("usagePeriod").asString()).isEqualTo("THREE_MONTHS");
        assertThat(updated.get("repurchaseYn").asBoolean()).isFalse();
        assertThat(updated.get("totalScore").decimalValue()).isEqualByComparingTo("20.00");
        assertThat(updated.get("scores").size()).isEqualTo(CRITERIA.size());
        assertThat(updated.get("communityRating").get("ratingCount").asLong()).isEqualTo(1);
        assertThat(updated.get("communityRating").get("canRate").asBoolean()).isFalse();

        Instant storedCreatedAt = jdbc.queryForObject(
                "SELECT created_at FROM reviews WHERE id = ?",
                (rs, rowNum) -> rs.getTimestamp(1).toInstant(),
                reviewId
        );
        Instant storedUpdatedAt = jdbc.queryForObject(
                "SELECT updated_at FROM reviews WHERE id = ?",
                (rs, rowNum) -> rs.getTimestamp(1).toInstant(),
                reviewId
        );
        assertThat(storedCreatedAt).isEqualTo(originalCreatedAt);
        assertThat(storedUpdatedAt).isAfter(originalCreatedAt);
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM review_scores WHERE review_id = ? AND score = 1",
                Integer.class,
                reviewId
        )).isEqualTo(CRITERIA.size());
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM review_firepower_ratings WHERE review_id = ? AND voter_id = ? AND score = 5",
                Integer.class,
                reviewId,
                voterId
        )).isEqualTo(1);

        JsonNode summary = mapper.readTree(send("GET", reviewsPath(), authorToken, null).body());
        assertThat(summary.get("templateId").asString()).isEqualTo(newerTemplateId);
        assertThat(summary.get("viewerReviewCriteria").get("templateId").asString())
                .isEqualTo("review-moisturizer-v1");
        List<String> viewerCriteriaIds = new ArrayList<>();
        summary.get("viewerReviewCriteria").get("criteria")
                .forEach(item -> viewerCriteriaIds.add(item.get("id").asString()));
        assertThat(viewerCriteriaIds).containsExactlyElementsOf(CRITERIA);
        assertThat(summary.get("reviewScore").decimalValue()).isEqualByComparingTo("20.0");
        assertThat(summary.get("viewerReview").get("content").asString()).contains("수정한 뒤 저장한");
    }

    @Test
    void missingOwnedReviewAndInvalidScoresDoNotChangeStoredReview() throws Exception {
        HttpResponse<String> missing = send("PUT", reviewsPath() + "/me", otherToken, updatePayload(5));
        assertThat(missing.statusCode()).isEqualTo(404);

        String incompleteScores = """
                {
                  "content": "이 요청은 항목 점수가 빠져 있어서 저장되면 안 되는 리뷰입니다.",
                  "skinType": "중성",
                  "usagePeriod": "ONE_WEEK",
                  "repurchaseYn": true,
                  "scores": [{"criteriaId":"moisture","score":5}]
                }
                """;
        HttpResponse<String> invalid = send("PUT", reviewsPath() + "/me", authorToken, incompleteScores);
        assertThat(invalid.statusCode()).isEqualTo(400);
        assertThat(invalid.body()).contains("모든 평가 항목의 점수를 선택해 주세요.");
        assertThat(jdbc.queryForObject(
                "SELECT content FROM reviews WHERE id = ?",
                String.class,
                reviewId
        )).contains("수정하기 전에");
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM review_scores WHERE review_id = ? AND score = 3",
                Integer.class,
                reviewId
        )).isEqualTo(CRITERIA.size());
    }

    private String addUser(String nickname) {
        String id = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status)
                VALUES (?, ?, NULL, ?, ?, 'USER', 'ACTIVE')
                """, id, id + "@example.com", nickname,
                ActivityNickname.key(ActivityNickname.normalize(nickname)));
        users.add(id);
        return id;
    }

    private String token(String userId) {
        Instant now = Instant.now();
        return jwtEncoder.encode(JwtEncoderParameters.from(JwtClaimsSet.builder()
                .issuer("hwaryeok-api")
                .subject(userId)
                .issuedAt(now)
                .expiresAt(now.plusSeconds(120))
                .id(UUID.randomUUID().toString())
                .claim("role", "USER")
                .claim("auth_method", "password")
                .claim("token_type", "access")
                .build())).getTokenValue();
    }

    private String reviewsPath() {
        return "/api/v1/products/" + productId + "/reviews";
    }

    private String updatePayload(int score) {
        String scores = CRITERIA.stream()
                .map(criteriaId -> "{\"criteriaId\":\"" + criteriaId + "\",\"score\":" + score + "}")
                .reduce((left, right) -> left + "," + right)
                .orElseThrow();
        return """
                {
                  "content": "수정한 뒤 저장한 충분히 구체적인 사용 후기입니다.",
                  "skinType": "지성",
                  "usagePeriod": "THREE_MONTHS",
                  "repurchaseYn": false,
                  "scores": [%s]
                }
                """.formatted(scores);
    }

    private HttpResponse<String> send(String method, String path, String token, String body) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (token != null) builder.header("Authorization", "Bearer " + token);
        if (body != null) builder.header("Content-Type", "application/json");
        return client.send(builder.method(
                method,
                body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body)
        ).build(), HttpResponse.BodyHandlers.ofString());
    }
}
