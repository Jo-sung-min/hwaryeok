package com.hwaryeok.review;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:reviewer-profile-http;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "app.storage.s3.bucket=hwaryeok-test",
        "app.storage.s3.key-prefix=hwaryeok",
        "app.storage.s3.public-base-url=https://cdn.example.com",
        "app.storage.s3.region=ap-northeast-2",
        "app.storage.s3.access-key-id=test-access-key",
        "app.storage.s3.secret-access-key=test-secret-key",
        "app.reviewer-profile.image.daily-presigned-url-limit=1"
})
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
        String nickname = "뷰티 기록가";
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status)
                VALUES (?, ?, 'unused', ?, ?, 'USER', 'ACTIVE')
                """, userId, userId + "@example.com", nickname,
                ActivityNickname.key(ActivityNickname.normalize(nickname)));
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
                "\"profileImageUrl\":null",
                "\"profileUpdatedAt\":null"
        );

        String payload = """
                {
                  "nickname": "  성분 기록가  ",
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
        assertThat(savedJson.get("nickname").asString()).isEqualTo("성분 기록가");
        assertThat(savedJson.get("bioBlocks").get(0).get("content").get(0).get("text").asString())
                .isEqualTo("성분을 꼼꼼히 기록하는 리뷰어예요.");
        assertThat(savedJson.get("blogUrl").asString()).isEqualTo("https://blog.example.com/hwaryeok");
        assertThat(savedJson.get("instagramUrl").asString()).isEqualTo("https://www.instagram.com/hwaryeok");
        assertThat(savedJson.get("profileUpdatedAt").isNull()).isFalse();

        var publicProfile = send("GET", "/api/v1/reviewers/" + userId + "/profile", null, null);
        assertThat(publicProfile.statusCode()).isEqualTo(200);
        assertThat(publicProfile.body()).contains(
                "\"userId\":\"" + userId + "\"",
                "\"nickname\":\"성분 기록가\"",
                "\"reviewCount\":0",
                "\"profileImageUrl\":null",
                "\"bioBlocks\":[",
                "\"blogUrl\":\"https://blog.example.com/hwaryeok\"",
                "\"instagramUrl\":\"https://www.instagram.com/hwaryeok\""
        ).doesNotContain("@example.com", "password_hash");
    }

    @Test
    void profileWritesRequireAuthenticationAndOnlyUseTheTokenOwner() throws Exception {
        assertThat(send("GET", "/api/v1/users/me/reviewer-profile", null, null).statusCode()).isEqualTo(401);
        assertThat(send("PUT", "/api/v1/users/me/reviewer-profile", null,
                "{\"nickname\":\"인증 없음\",\"bioBlocks\":[],\"blogUrl\":null,\"instagramUrl\":null}").statusCode()).isEqualTo(401);

        String otherUserId = UUID.randomUUID().toString();
        String otherNickname = "다른 리뷰어";
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status)
                VALUES (?, ?, 'unused', ?, ?, 'USER', 'ACTIVE')
                """, otherUserId, otherUserId + "@example.com", otherNickname,
                ActivityNickname.key(ActivityNickname.normalize(otherNickname)));
        try {
            var saved = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                    "{\"nickname\":\"내 활동명\",\"bioBlocks\":[],\"blogUrl\":\"https://example.com/me\",\"instagramUrl\":null}");
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
    void nicknameIsTrimmedBoundedAndUniqueIgnoringCase() throws Exception {
        var renamed = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"nickname\":\"  GlowNote  \",\"bioBlocks\":[],\"blogUrl\":null,\"instagramUrl\":null}");
        assertThat(renamed.statusCode()).isEqualTo(200);
        assertThat(renamed.body()).contains("\"nickname\":\"GlowNote\"");
        assertThat(jdbc.queryForObject("SELECT nickname FROM users WHERE id = ?", String.class, userId))
                .isEqualTo("GlowNote");

        String otherUserId = UUID.randomUUID().toString();
        String otherNickname = "다른 리뷰어 " + otherUserId.substring(0, 8);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status)
                VALUES (?, ?, 'unused', ?, ?, 'USER', 'ACTIVE')
                """, otherUserId, otherUserId + "@example.com", otherNickname,
                ActivityNickname.key(ActivityNickname.normalize(otherNickname)));
        try {
            var duplicate = send("PUT", "/api/v1/users/me/reviewer-profile", token(otherUserId),
                    "{\"nickname\":\" glownote \",\"bioBlocks\":[],\"blogUrl\":null,\"instagramUrl\":null}");
            assertThat(duplicate.statusCode()).isEqualTo(409);
            assertThat(duplicate.body()).contains("NICKNAME_ALREADY_EXISTS");
            assertThat(jdbc.queryForObject("SELECT nickname FROM users WHERE id = ?", String.class, otherUserId))
                    .startsWith("다른 리뷰어 ");
        } finally {
            jdbc.update("DELETE FROM users WHERE id = ?", otherUserId);
        }

        assertThat(send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"nickname\":\" a \",\"bioBlocks\":[],\"blogUrl\":null,\"instagramUrl\":null}").statusCode())
                .isEqualTo(400);
        assertThat(send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"nickname\":\"123456789012345678901\",\"bioBlocks\":[],\"blogUrl\":null,\"instagramUrl\":null}").statusCode())
                .isEqualTo(400);
        assertThat(jdbc.queryForObject("SELECT nickname FROM users WHERE id = ?", String.class, userId))
                .isEqualTo("GlowNote");
    }

    @Test
    void profileImageUploadTicketIsPrivateOwnerBoundAndRejectsUnsupportedFiles() throws Exception {
        String preparePath = "/api/v1/users/me/reviewer-profile/image-upload-url";
        String completePath = "/api/v1/users/me/reviewer-profile/image-upload-complete";
        assertThat(send("POST", preparePath, null,
                "{\"fileName\":\"avatar.png\",\"contentType\":\"image/png\",\"size\":128}").statusCode())
                .isEqualTo(401);
        assertThat(send("POST", completePath, null,
                "{\"objectKey\":\"pending/reviewer-profile-images/avatar.png\"}").statusCode())
                .isEqualTo(401);
        var unsupported = send("POST", preparePath, token,
                "{\"fileName\":\"avatar.svg\",\"contentType\":\"image/svg+xml\",\"size\":128}");
        assertThat(unsupported.statusCode()).isEqualTo(400);
        assertThat(unsupported.body()).contains("PNG", "JPG").doesNotContain("WEBP");

        var prepared = send("POST", preparePath, token,
                "{\"fileName\":\"avatar.png\",\"contentType\":\"image/png\",\"size\":128}");
        assertThat(prepared.statusCode()).isEqualTo(200);
        assertThat(prepared.headers().firstValue("Cache-Control")).contains("no-store");
        var ticket = mapper.readTree(prepared.body());
        assertThat(ticket.get("uploadUrl").asString()).startsWith("https://");
        assertThat(ticket.get("objectKey").asString()).contains("/pending/profile-images/" + userId + "/");
        assertThat(ticket.get("imageUrl").asString()).contains("/profiles/" + userId + "/");
        assertThat(ticket.get("headers").get("Content-Type").asString()).isEqualTo("image/png");
        assertThat(ticket.get("headers").toString()).doesNotContain("Authorization", "Cookie");

        var limited = send("POST", preparePath, token,
                "{\"fileName\":\"avatar.jpg\",\"contentType\":\"image/jpeg\",\"size\":128}");
        assertThat(limited.statusCode()).isEqualTo(429);
        assertThat(limited.headers().firstValue("Retry-After")).isPresent();
        assertThat(limited.body()).contains("PROFILE_IMAGE_DAILY_LIMIT");

        String foreignObjectKey = ticket.get("objectKey").asString().replace(userId, UUID.randomUUID().toString());
        var foreignCompletion = send("POST", completePath, token,
                "{\"objectKey\":\"" + foreignObjectKey + "\"}");
        assertThat(foreignCompletion.statusCode()).isEqualTo(400);
    }

    @Test
    void ownerAndPublicProfileResponsesExposeTheStoredProfileImage() throws Exception {
        String imageUrl = "https://cdn.example.com/reviewer-profile-images/" + userId + "/avatar.webp";
        jdbc.update("UPDATE reviewer_profiles SET profile_image_url = ? WHERE user_id = ?", imageUrl, userId);
        if (jdbc.queryForObject("SELECT COUNT(*) FROM reviewer_profiles WHERE user_id = ?", Integer.class, userId) == 0) {
            jdbc.update("INSERT INTO reviewer_profiles (user_id, profile_image_url) VALUES (?, ?)", userId, imageUrl);
        }

        var mine = send("GET", "/api/v1/users/me/reviewer-profile", token, null);
        var publicProfile = send("GET", "/api/v1/reviewers/" + userId + "/profile", null, null);
        assertThat(mine.statusCode()).isEqualTo(200);
        assertThat(publicProfile.statusCode()).isEqualTo(200);
        assertThat(mine.body()).contains("\"profileImageUrl\":\"" + imageUrl + "\"");
        assertThat(publicProfile.body()).contains("\"profileImageUrl\":\"" + imageUrl + "\"");
    }

    @Test
    void rejectsNonHttpLinksAndMalformedBlockNoteDocumentsWithoutOverwriting() throws Exception {
        String valid = "{\"nickname\":\"뷰티 기록가\",\"bioBlocks\":[],\"blogUrl\":\"https://example.com/valid\",\"instagramUrl\":null}";
        assertThat(send("PUT", "/api/v1/users/me/reviewer-profile", token, valid).statusCode()).isEqualTo(200);

        var javascriptUrl = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"nickname\":\"뷰티 기록가\",\"bioBlocks\":[],\"blogUrl\":\"javascript:alert(1)\",\"instagramUrl\":null}");
        assertThat(javascriptUrl.statusCode()).isEqualTo(400);
        assertThat(javascriptUrl.body()).contains("INVALID_REQUEST", "http");

        var credentialUrl = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"nickname\":\"뷰티 기록가\",\"bioBlocks\":[],\"blogUrl\":null,\"instagramUrl\":\"https://user:secret@example.com/me\"}");
        assertThat(credentialUrl.statusCode()).isEqualTo(400);

        var disguisedInstagramUrl = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"nickname\":\"뷰티 기록가\",\"bioBlocks\":[],\"blogUrl\":null,\"instagramUrl\":\"https://example.com/not-instagram\"}");
        assertThat(disguisedInstagramUrl.statusCode()).isEqualTo(400);
        assertThat(disguisedInstagramUrl.body()).contains("instagram.com");

        var nonArrayDocument = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"nickname\":\"뷰티 기록가\",\"bioBlocks\":{\"type\":\"paragraph\"},\"blogUrl\":null,\"instagramUrl\":null}");
        assertThat(nonArrayDocument.statusCode()).isEqualTo(400);
        assertThat(nonArrayDocument.body()).contains("BlockNote");

        var mediaBlock = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"nickname\":\"뷰티 기록가\",\"bioBlocks\":[{\"type\":\"image\",\"props\":{\"url\":\"https://tracker.example/pixel\"},\"children\":[]}],\"blogUrl\":null,\"instagramUrl\":null}");
        assertThat(mediaBlock.statusCode()).isEqualTo(400);
        assertThat(mediaBlock.body()).contains("텍스트 블록");

        var unsafeInlineLink = send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"nickname\":\"뷰티 기록가\",\"bioBlocks\":[{\"type\":\"paragraph\",\"props\":{},\"content\":[{\"type\":\"link\",\"href\":\"https://trusted.example\",\"content\":\"누르기\"}],\"children\":[]}],\"blogUrl\":null,\"instagramUrl\":null}");
        assertThat(unsafeInlineLink.statusCode()).isEqualTo(400);
        assertThat(unsafeInlineLink.body()).contains("링크", "Instagram");

        var preserved = mapper.readTree(send("GET", "/api/v1/users/me/reviewer-profile", token, null).body());
        assertThat(preserved.get("blogUrl").asString()).isEqualTo("https://example.com/valid");
    }

    @Test
    void inactiveReviewersCannotUseOrExposeTheirProfile() throws Exception {
        assertThat(send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"nickname\":\"뷰티 기록가\",\"bioBlocks\":[],\"blogUrl\":\"https://example.com\",\"instagramUrl\":null}").statusCode())
                .isEqualTo(200);
        jdbc.update("UPDATE users SET status = 'SUSPENDED' WHERE id = ?", userId);

        assertThat(send("GET", "/api/v1/users/me/reviewer-profile", token, null).statusCode()).isEqualTo(401);
        assertThat(send("PUT", "/api/v1/users/me/reviewer-profile", token,
                "{\"nickname\":\"뷰티 기록가\",\"bioBlocks\":[],\"blogUrl\":null,\"instagramUrl\":null}").statusCode()).isEqualTo(401);
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
