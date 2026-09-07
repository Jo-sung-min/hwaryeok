package com.hwaryeok.usagevideo;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class UsageVideoHttpTest {

    private static final String PRODUCT_PATH = "/api/v1/products/birch-cream/usage-videos";
    private static final String SUBMISSION = """
            {"title":"크림 사용법","videoUrl":"https://youtu.be/AbC_12345-6","channelName":"화력 테스트 채널",
             "channelUrl":"https://www.youtube.com/@hwaryeok-test","description":"회원이 등록한 사용법"}
            """;

    @LocalServerPort private int port;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private JwtEncoder jwtEncoder;
    @Autowired private ObjectMapper mapper;
    private final HttpClient client = HttpClient.newHttpClient();
    private final List<String> users = new ArrayList<>();

    @AfterEach
    void cleanUp() {
        for (String id : users) jdbc.update("DELETE FROM product_usage_videos WHERE author_id = ?", id);
        for (String id : users) jdbc.update("DELETE FROM users WHERE id = ?", id);
    }

    @Test
    void protectsPrivateEndpointsAndCompletesApprovalEditAndDeleteLifecycle() throws Exception {
        String owner = user("USER");
        String other = user("USER");
        String admin = user("ADMIN");
        String ownerToken = token(owner, "USER");
        String otherToken = token(other, "USER");
        String adminToken = token(admin, "ADMIN");

        assertThat(send("GET", PRODUCT_PATH, null, null).statusCode()).isEqualTo(200);
        assertThat(send("GET", "/api/v1/me/usage-videos", null, null).statusCode()).isEqualTo(401);
        assertThat(send("POST", PRODUCT_PATH, null, SUBMISSION).statusCode()).isEqualTo(401);
        assertThat(send("GET", "/api/v1/admin/usage-videos", ownerToken, null).statusCode()).isEqualTo(403);
        assertThat(send("POST", PRODUCT_PATH, ownerToken, "{\"title\":\"누락\"}").statusCode()).isEqualTo(400);

        var created = send("POST", PRODUCT_PATH, ownerToken, SUBMISSION);
        assertThat(created.statusCode()).isEqualTo(201);
        String id = mapper.readTree(created.body()).get("id").asText();
        assertThat(created.body()).contains("\"status\":\"PENDING\"", "https://www.youtube.com/watch?v=AbC_12345-6");
        assertThat(send("GET", PRODUCT_PATH, null, null).body()).doesNotContain(id);
        assertThat(send("GET", "/api/v1/me/usage-videos", ownerToken, null).body()).contains(id);
        assertThat(send("GET", "/api/v1/me/usage-videos", otherToken, null).body()).doesNotContain(id);
        assertThat(send("PATCH", "/api/v1/me/usage-videos/" + id, otherToken, SUBMISSION).statusCode()).isEqualTo(403);
        assertThat(send("DELETE", "/api/v1/me/usage-videos/" + id, otherToken, null).statusCode()).isEqualTo(403);
        assertThat(send("GET", "/api/v1/admin/usage-videos?status=PENDING", adminToken, null).body()).contains(id);

        String approval = "{\"status\":\"APPROVED\",\"featured\":true,\"displayOrder\":1,\"moderationNote\":\"운영 검토 메모\"}";
        assertThat(send("PATCH", "/api/v1/admin/usage-videos/" + id, ownerToken, approval).statusCode()).isEqualTo(403);
        assertThat(send("PATCH", "/api/v1/admin/usage-videos/" + id, adminToken, approval).statusCode()).isEqualTo(200);
        var exposed = send("GET", PRODUCT_PATH, null, null);
        assertThat(exposed.body()).contains(id, "\"featured\":true").doesNotContain("운영 검토 메모", "@example.com");
        assertThat(send("PATCH", "/api/v1/me/usage-videos/" + id, ownerToken, SUBMISSION).body()).contains("\"status\":\"PENDING\"");
        assertThat(send("GET", PRODUCT_PATH, null, null).body()).doesNotContain(id);
        assertThat(send("DELETE", "/api/v1/me/usage-videos/" + id, ownerToken, null).statusCode()).isEqualTo(204);
        assertThat(send("GET", "/api/v1/me/usage-videos", ownerToken, null).body()).doesNotContain(id);
    }

    @Test
    void checksCurrentAccountStateEvenForPreviouslyIssuedTokens() throws Exception {
        String owner = user("USER");
        String admin = user("ADMIN");
        String ownerToken = token(owner, "USER");
        String adminToken = token(admin, "ADMIN");
        jdbc.update("UPDATE users SET role = 'USER' WHERE id = ?", admin);
        assertThat(send("GET", "/api/v1/admin/usage-videos", adminToken, null).statusCode()).isEqualTo(403);
        jdbc.update("UPDATE users SET status = 'WITHDRAWN' WHERE id = ?", owner);
        assertThat(send("POST", PRODUCT_PATH, ownerToken, SUBMISSION).statusCode()).isEqualTo(401);
        assertThat(send("GET", "/api/v1/me/usage-videos", ownerToken, null).statusCode()).isEqualTo(401);
    }

    private String user(String role) {
        String id = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO users (id, email, password_hash, nickname, role, status) VALUES (?, ?, 'unused', '영상 HTTP 테스트', ?, 'ACTIVE')",
                id, id + "@example.com", role);
        users.add(id);
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
