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
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.datasource.url=jdbc:h2:mem:review-reputation-http;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
class ReviewFirepowerHttpTest {

    @LocalServerPort private int port;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private JwtEncoder jwtEncoder;
    @Autowired private ObjectMapper mapper;
    private final HttpClient client = HttpClient.newHttpClient();
    private final List<String> users = new ArrayList<>();
    private String author;
    private String product;
    private String review;
    private String ratingPath;

    @BeforeEach
    void setUp() {
        author = user("USER");
        jdbc.update("INSERT INTO user_skin_profiles (user_id, skin_type) VALUES (?, '건성')", author);
        product = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO products (id, brand, name, category, base_score, benefit, sub_benefit, price, tone, publication_status)
                VALUES (?, '테스트', '리뷰 보안 테스트 크림', '크림', 80, '보습', '보습', 10000, 'rose', 'PUBLISHED')
                """, product);
        review = review(author);
        ratingPath = "/api/v1/reviews/" + review + "/firepower";
    }

    @AfterEach
    void cleanUpIsolatedInMemoryFixtures() {
        for (String id : users) jdbc.update("DELETE FROM users WHERE id = ?", id);
        if (product != null) jdbc.update("DELETE FROM products WHERE id = ?", product);
    }

    @Test
    void anonymousReadersCanSeePublicAggregatesButCannotWriteRatings() throws Exception {
        var rating = send("GET", ratingPath, null, null);
        assertThat(rating.statusCode()).isEqualTo(200);
        assertThat(rating.body()).contains("\"averageScore\":null", "\"ratingCount\":0", "\"canRate\":false");
        var ranking = send("GET", "/api/v1/reviewers/ranking", null, null);
        assertThat(ranking.statusCode()).isEqualTo(200);
        assertThat(ranking.body()).contains(author, "\"skinType\":\"건성\"", "\"rank\":null")
                .doesNotContain("@example.com", "password", "skin_concerns");
        var profile = send("GET", "/api/v1/reviewers/" + author + "/profile", null, null);
        assertThat(profile.statusCode()).isEqualTo(200);
        assertThat(profile.body()).contains("\"reviewCount\":1", "\"reviewFirepower\":null");
        assertThat(send("PUT", ratingPath, null, "{\"score\":10}").statusCode()).isEqualTo(401);
        assertThat(send("DELETE", ratingPath, null, null).statusCode()).isEqualTo(401);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM review_firepower_ratings WHERE review_id = ?", Integer.class, review)).isZero();
    }

    @Test
    void authenticatedUsersAndAdminsFollowIdenticalSelfRatingAndSingleVoteRules() throws Exception {
        String voter = user("USER");
        String admin = user("ADMIN");
        String authorToken = token(author, "USER");
        String voterToken = token(voter, "USER");
        String adminToken = token(admin, "ADMIN");
        assertThat(send("PUT", ratingPath, authorToken, "{\"score\":10}").statusCode()).isEqualTo(403);
        assertThat(send("DELETE", ratingPath, authorToken, null).statusCode()).isEqualTo(403);
        assertThat(send("PUT", ratingPath, voterToken, "{\"score\":0}").statusCode()).isEqualTo(400);
        assertThat(send("PUT", ratingPath, voterToken, "{\"score\":11}").statusCode()).isEqualTo(400);
        assertThat(send("PUT", ratingPath, voterToken, "{}").statusCode()).isEqualTo(400);

        assertThat(send("PUT", ratingPath, voterToken, "{\"score\":4}").statusCode()).isEqualTo(200);
        var updated = send("PUT", ratingPath, voterToken, "{\"score\":8}");
        assertThat(updated.statusCode()).isEqualTo(200);
        assertThat(updated.body()).contains("\"ratingCount\":1", "\"viewerScore\":8");
        assertThat(send("PUT", ratingPath, adminToken, "{\"score\":10}").statusCode()).isEqualTo(200);
        var summary = mapper.readTree(send("GET", ratingPath, voterToken, null).body());
        assertThat(summary.get("averageScore").asDouble()).isEqualTo(9.0);
        assertThat(summary.get("ratingCount").asLong()).isEqualTo(2);
        assertThat(summary.get("viewerScore").asInt()).isEqualTo(8);

        var profile = mapper.readTree(send("GET", "/api/v1/reviewers/" + author + "/profile", null, null).body());
        assertThat(profile.get("averageReceivedRating").asDouble()).isEqualTo(9.0);
        assertThat(profile.get("receivedRatingCount").asLong()).isEqualTo(2);
        assertThat(profile.get("uniqueRaterCount").asLong()).isEqualTo(2);
        assertThat(profile.get("reviewFirepower").asDouble()).isEqualTo(61.4);
        var ranking = mapper.readTree(send("GET", "/api/v1/reviewers/ranking", null, null).body());
        var rankedAuthor = ranking.get("content").get(0);
        assertThat(rankedAuthor.get("userId").asString()).isEqualTo(author);
        assertThat(rankedAuthor.get("rank").asInt()).isEqualTo(1);
        assertThat(rankedAuthor.get("reviewFirepower").asDouble()).isEqualTo(61.4);

        String adminReviewPath = "/api/v1/reviews/" + review(admin) + "/firepower";
        assertThat(send("PUT", adminReviewPath, adminToken, "{\"score\":10}").statusCode()).isEqualTo(403);
        var removed = send("DELETE", ratingPath, voterToken, null);
        assertThat(removed.statusCode()).isEqualTo(200);
        assertThat(removed.body()).contains("\"ratingCount\":1", "\"viewerScore\":null");
        assertThat(send("GET", ratingPath, adminToken, null).body()).contains("\"viewerScore\":10");
        assertThat(jdbc.queryForObject("SELECT total_score FROM reviews WHERE id = ?", Integer.class, review)).isEqualTo(80);
    }

    @Test
    void staleTokensCannotWriteAndHiddenOrInactiveAuthorsDoNotLeakThroughPublicRoutes() throws Exception {
        String voter = user("USER");
        String voterToken = token(voter, "USER");
        assertThat(send("PUT", ratingPath, voterToken, "{\"score\":10}").statusCode()).isEqualTo(200);
        jdbc.update("UPDATE users SET status = 'SUSPENDED' WHERE id = ?", voter);
        assertThat(send("PUT", ratingPath, voterToken, "{\"score\":8}").statusCode()).isEqualTo(401);
        assertThat(send("DELETE", ratingPath, voterToken, null).statusCode()).isEqualTo(401);
        assertThat(send("GET", ratingPath, voterToken, null).body())
                .contains("\"ratingCount\":0", "\"viewerScore\":null", "\"canRate\":false");
        jdbc.update("UPDATE products SET publication_status = 'HIDDEN' WHERE id = ?", product);
        assertThat(send("GET", ratingPath, null, null).statusCode()).isEqualTo(404);
        assertThat(send("GET", "/api/v1/reviewers/ranking", null, null).body()).doesNotContain(author);
        assertThat(send("GET", "/api/v1/reviewers/" + author + "/reviews", null, null).body()).doesNotContain(review);
        jdbc.update("UPDATE users SET status = 'WITHDRAWN' WHERE id = ?", author);
        assertThat(send("GET", "/api/v1/reviewers/" + author + "/profile", null, null).statusCode()).isEqualTo(404);
    }

    private String user(String role) {
        String id = UUID.randomUUID().toString();
        String nickname = "화력 HTTP " + id.substring(0, 8);
        jdbc.update("INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status) VALUES (?, ?, 'unused', ?, ?, ?, 'ACTIVE')",
                id, id + "@example.com", nickname, ActivityNickname.key(ActivityNickname.normalize(nickname)), role);
        users.add(id);
        return id;
    }

    private String review(String userId) {
        String id = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO reviews (id, product_id, user_id, template_id, total_score, content, skin_type, usage_period, repurchase_yn)
                VALUES (?, ?, ?, 'review-moisturizer-v1', 80, '화력 보안 검증용으로 작성한 리뷰입니다.', '건성', 'ONE_MONTH', TRUE)
                """, id, product, userId);
        return id;
    }

    private String token(String id, String role) {
        Instant now = Instant.now();
        return jwtEncoder.encode(JwtEncoderParameters.from(JwtClaimsSet.builder()
                .issuer("hwaryeok-api").subject(id).issuedAt(now).expiresAt(now.plusSeconds(120))
                .id(UUID.randomUUID().toString()).claim("role", role).claim("auth_method", "password")
                .claim("token_type", "access").build())).getTokenValue();
    }

    private HttpResponse<String> send(String method, String path, String token, String json) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (token != null) builder.header("Authorization", "Bearer " + token);
        if (json != null) builder.header("Content-Type", "application/json");
        return client.send(builder.method(method, json == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json)).build(),
                HttpResponse.BodyHandlers.ofString());
    }
}
