package com.hwaryeok.review;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.UUID;

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
        properties = "spring.datasource.url=jdbc:h2:mem:reviewer-profile-http;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
class ReviewerProfileHttpTest {

    @LocalServerPort private int port;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private JwtEncoder jwtEncoder;
    @Autowired private ObjectMapper mapper;

    private final HttpClient client = HttpClient.newHttpClient();
    private String userId;
    private String token;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, role, status)
                VALUES (?, ?, 'unused', '뷰티 기록가', 'USER', 'ACTIVE')
                """, userId, userId + "@example.com");
        token = token(userId);
    }

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM users WHERE id = ?", userId);
    }

    @Test
    void authenticatedReviewerCanEditAndAnonymousReaderCanSeePresentation() throws Exception {
        var initial = send("GET", "/api/v1/users/me/reviewer-profile", token, null);
        assertThat(initial.statusCode()).isEqualTo(200);
        assertThat(initial.body()).contains(
                "\"userId\":\"" + userId + "\"",
                "\"nickname\":\"뷰티 기록가\"",
                "\"bioBlocks\":[]",
                "\"blogUrl\":null",
                "\"instagramUrl\":null",
                "\"profileUpdatedAt\":null"
        );

        String payload = """
                {
                  "bioBlocks": [{
                    "id": "intro-1",
                    "type": "paragraph",
                    "props": {},
                    "content": [{"type": "text", "text": "성분을 꼼꼼히 기록하는 리뷰어예요.", "styles": {"bold": true}}],
                    "children": []
                  }],
                  "blogUrl": "https://blog.example.com/hwaryeok",
                  "instagramUrl": "https://www.instagram.com/hwaryeok"
                }
                """;
        var saved = send("PUT", "/api/v1/users/me/reviewer-profile", token, payload);
        assertThat(saved.statusCode()).isEqualTo(200);
        var savedJson = mapper.readTree(saved.body());
        assertThat(savedJson.get("bioBlocks").isArray()).isTrue();
        assertThat(savedJson.get("bioBlocks").get(0).get("content").get(0).get("text").asString())
                .isEqualTo("성분을 꼼꼼히 기록하는 리뷰어예요.");
        assertThat(savedJson.get("blogUrl").asString()).isEqualTo("https://blog.example.com/hwaryeok");
        assertThat(savedJson.get("instagramUrl").asString()).isEqualTo("https://www.instagram.com/hwaryeok");
        assertThat(savedJson.get("profileUpdatedAt").isNull()).isFalse();

        var publicProfile = send("GET", "/api/v1/reviewers/" + userId + "/profile", null, null);
        assertThat(publicProfile.statusCode()).isEqualTo(200);
        assertThat(publicProfile.body()).contains(
                "\"userId\":\"" + userId + "\"",
                "\"reviewCount\":0",
                "\"bioBlocks\":[",
                "\"blogUrl\":\"https://blog.example.com/hwaryeok\"",
                "\"instagramUrl\":\"https://www.instagram.com/hwaryeok\""
        ).doesNotContain("@example.com", "password_hash");
    }

    @Test
    void profileWritesRequireAuthenticationAndOnlyUseTheTokenOwner() throws Exception {
        assertThat(send("GET", "/api/v1/users/me/reviewer-profile", null, null).statusCode()).isEqualTo(401);
        assertThat(send("PUT", "/api/v1/users/me/reviewer-profile", null,
                "{\"bioBlocks\":[],\"blogUrl\":null,\"instagramUrl\":null}").statusCode()).isEqualTo(401);

        String otherUserId = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, role, status)
                VALUES (?, ?, 'unused', '다른 리뷰어', 'USER', 'ACTIVE')
                """, otherUserId, otherUserId + "@example.com");
        try {
            var saved = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                    "{\"bioBlocks\":[],\"blogUrl\":\"https://example.com/me\",\"instagramUrl\":null}");
            assertThat(saved.statusCode()).isEqualTo(200);
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reviewer_profiles WHERE user_id = ?", Integer.class, userId))
                    .isEqualTo(1);
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reviewer_profiles WHERE user_id = ?", Integer.class, otherUserId))
                    .isZero();
        } finally {
            jdbc.update("DELETE FROM users WHERE id = ?", otherUserId);
        }
    }

    @Test
    void rejectsNonHttpLinksAndMalformedBlockNoteDocumentsWithoutOverwriting() throws Exception {
        String valid = "{\"bioBlocks\":[],\"blogUrl\":\"https://example.com/valid\",\"instagramUrl\":null}";
        assertThat(send("PUT", "/api/v1/users/me/reviewer-profile", token, valid).statusCode()).isEqualTo(200);

        var javascriptUrl = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"bioBlocks\":[],\"blogUrl\":\"javascript:alert(1)\",\"instagramUrl\":null}");
        assertThat(javascriptUrl.statusCode()).isEqualTo(400);
        assertThat(javascriptUrl.body()).contains("INVALID_REQUEST", "http");

        var credentialUrl = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"bioBlocks\":[],\"blogUrl\":null,\"instagramUrl\":\"https://user:secret@example.com/me\"}");
        assertThat(credentialUrl.statusCode()).isEqualTo(400);

        var disguisedInstagramUrl = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"bioBlocks\":[],\"blogUrl\":null,\"instagramUrl\":\"https://example.com/not-instagram\"}");
        assertThat(disguisedInstagramUrl.statusCode()).isEqualTo(400);
        assertThat(disguisedInstagramUrl.body()).contains("instagram.com");

        var nonArrayDocument = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"bioBlocks\":{\"type\":\"paragraph\"},\"blogUrl\":null,\"instagramUrl\":null}");
        assertThat(nonArrayDocument.statusCode()).isEqualTo(400);
        assertThat(nonArrayDocument.body()).contains("BlockNote");

        var mediaBlock = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"bioBlocks\":[{\"type\":\"image\",\"props\":{\"url\":\"https://tracker.example/pixel\"},\"children\":[]}],\"blogUrl\":null,\"instagramUrl\":null}");
        assertThat(mediaBlock.statusCode()).isEqualTo(400);
        assertThat(mediaBlock.body()).contains("텍스트 블록");

        var unsafeInlineLink = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"bioBlocks\":[{\"type\":\"paragraph\",\"props\":{},\"content\":[{\"type\":\"link\",\"href\":\"https://trusted.example\",\"content\":\"누르기\"}],\"children\":[]}],\"blogUrl\":null,\"instagramUrl\":null}");
        assertThat(unsafeInlineLink.statusCode()).isEqualTo(400);
        assertThat(unsafeInlineLink.body()).contains("링크", "Instagram");

        var preserved = mapper.readTree(send("GET", "/api/v1/users/me/reviewer-profile", token, null).body());
        assertThat(preserved.get("blogUrl").asString()).isEqualTo("https://example.com/valid");
    }

    @Test
    void inactiveReviewersCannotUseOrExposeTheirProfile() throws Exception {
        assertThat(send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"bioBlocks\":[],\"blogUrl\":\"https://example.com\",\"instagramUrl\":null}").statusCode())
                .isEqualTo(200);
        jdbc.update("UPDATE users SET status = 'SUSPENDED' WHERE id = ?", userId);

        assertThat(send("GET", "/api/v1/users/me/reviewer-profile", token, null).statusCode()).isEqualTo(401);
        assertThat(send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"bioBlocks\":[],\"blogUrl\":null,\"instagramUrl\":null}").statusCode()).isEqualTo(401);
        assertThat(send("GET", "/api/v1/reviewers/" + userId + "/profile", null, null).statusCode()).isEqualTo(404);
    }

    @Test
    void corruptedStoredBioDoesNotBreakOwnerOrPublicProfileReads() throws Exception {
        jdbc.update("""
                INSERT INTO reviewer_profiles (user_id, introduction_json, blog_url)
                VALUES (?, '{', 'https://example.com/still-visible')
                """, userId);

        var mine = send("GET", "/api/v1/users/me/reviewer-profile", token, null);
        var publicProfile = send("GET", "/api/v1/reviewers/" + userId + "/profile", null, null);

        assertThat(mine.statusCode()).isEqualTo(200);
        assertThat(publicProfile.statusCode()).isEqualTo(200);
        assertThat(mine.body()).contains("\"bioBlocks\":[]", "\"blogUrl\":\"https://example.com/still-visible\"");
        assertThat(publicProfile.body()).contains("\"bioBlocks\":[]", "\"blogUrl\":\"https://example.com/still-visible\"");
    }

    private String token(String id) {
        Instant now = Instant.now();
        return jwtEncoder.encode(JwtEncoderParameters.from(JwtClaimsSet.builder()
                .issuer("hwaryeok-api")
                .subject(id)
                .issuedAt(now)
                .expiresAt(now.plusSeconds(120))
                .id(UUID.randomUUID().toString())
                .claim("role", "USER")
                .claim("auth_method", "password")
                .claim("token_type", "access")
                .build())).getTokenValue();
    }

    private HttpResponse<String> send(String method, String path, String accessToken, String json) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (accessToken != null) builder.header("Authorization", "Bearer " + accessToken);
        if (json != null) builder.header("Content-Type", "application/json");
        return client.send(builder.method(
                        method,
                        json == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json)
                ).build(), HttpResponse.BodyHandlers.ofString());
    }
}
