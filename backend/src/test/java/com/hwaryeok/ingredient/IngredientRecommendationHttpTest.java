package com.hwaryeok.ingredient;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashSet;
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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class IngredientRecommendationHttpTest {

    private static final String RECOMMENDATIONS_PATH = "/api/v1/ingredients/recommendations";

    @LocalServerPort
    private int port;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private JwtEncoder jwtEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private final HttpClient client = HttpClient.newHttpClient();
    private String userId;

    @AfterEach
    void cleanUp() {
        if (userId != null) jdbc.update("DELETE FROM users WHERE id = ?", userId);
    }

    @Test
    void recommendsDbIngredientsWithStablePublicContractAndIgnoresMissingPreferenceIds() throws Exception {
        String payload = """
                {
                  "profile": {
                    "skinType":"민감", "hydrationLevel":"LOW", "oilinessLevel":"BALANCED",
                    "cheekOiliness":"LOW", "sensitivityLevel":"HIGH", "breakoutFrequency":"OCCASIONAL",
                    "cleansingTightness":"LONG", "rednessFrequency":"FREQUENT", "poreLevel":"MEDIUM",
                    "texturePreference":"BALANCED", "routineComplexity":"STANDARD", "sunscreenUsage":"DAILY",
                    "reactionTriggers":[], "breakoutZones":[], "environments":["냉난방 건조"],
                    "routineContexts":[], "concerns":["장벽·각질"]
                  },
                  "preferredIngredientIds":["missing-ingredient", "panthenol"],
                  "limit":4
                }
                """;

        HttpResponse<String> first = send("POST", RECOMMENDATIONS_PATH, null, payload);
        HttpResponse<String> second = send("POST", RECOMMENDATIONS_PATH, null, payload);
        assertThat(first.statusCode()).isEqualTo(200);
        assertThat(second.statusCode()).isEqualTo(200);
        assertThat(second.body()).isEqualTo(first.body());

        JsonNode result = objectMapper.readTree(first.body());
        assertThat(result.isArray()).isTrue();
        assertThat(result.size()).isBetween(1, 4);
        var ids = new HashSet<String>();
        boolean foundPreferredPanthenol = false;
        for (JsonNode item : result) {
            String id = item.get("ingredient").get("id").asString();
            assertThat(ids.add(id)).as("추천 성분 ID 중복 없음").isTrue();
            assertThat(item.get("ingredient").get("status").asString()).isNotEqualTo("CAUTION");
            assertThat(item.get("reason").asString()).isNotBlank();
            assertThat(item.get("matchedBy").isArray()).isTrue();
            if (id.equals("panthenol")) foundPreferredPanthenol = item.get("preferred").asBoolean();
        }
        assertThat(foundPreferredPanthenol).isTrue();
    }

    @Test
    void validatesRecommendationLimitProfileAndDuplicatePreferences() throws Exception {
        String invalidLimit = validRecommendationPayload().replace("\"limit\":4", "\"limit\":7");
        HttpResponse<String> limitResponse = send("POST", RECOMMENDATIONS_PATH, null, invalidLimit);
        assertThat(limitResponse.statusCode()).isEqualTo(400);
        assertThat(limitResponse.body()).contains("VALIDATION_FAILED", "추천 성분 수는 6개 이하여야 해요");

        String invalidSkin = validRecommendationPayload().replace("\"skinType\":\"건성\"", "\"skinType\":\"알 수 없음\"");
        HttpResponse<String> skinResponse = send("POST", RECOMMENDATIONS_PATH, null, invalidSkin);
        assertThat(skinResponse.statusCode()).isEqualTo(400);
        assertThat(skinResponse.body()).contains("VALIDATION_FAILED", "지원하지 않는 피부 타입이에요");

        String duplicates = validRecommendationPayload().replace(
                "\"preferredIngredientIds\":[]",
                "\"preferredIngredientIds\":[\"panthenol\",\" panthenol \"]"
        );
        HttpResponse<String> duplicateResponse = send("POST", RECOMMENDATIONS_PATH, null, duplicates);
        assertThat(duplicateResponse.statusCode()).isEqualTo(400);
        assertThat(duplicateResponse.body()).contains("INVALID_REQUEST", "중복");
    }

    @Test
    void roundTripsOptionalCheekOilinessAndStoresExpandedConcernLabels() throws Exception {
        userId = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, role, status)
                VALUES (?, ?, 'unused', '볼 유분 테스트', 'USER', 'ACTIVE')
                """, userId, userId + "@example.com");
        String token = token(userId);
        String profile = """
                {
                  "skinType":"복합성", "hydrationLevel":"LOW", "oilinessLevel":"HIGH",
                  "cheekOiliness":"LOW", "sensitivityLevel":"MEDIUM", "breakoutFrequency":"OCCASIONAL",
                  "cleansingTightness":"LONG", "rednessFrequency":"OCCASIONAL", "poreLevel":"MEDIUM",
                  "texturePreference":"LIGHT", "routineComplexity":"STANDARD", "sunscreenUsage":"DAILY",
                  "reactionTriggers":[], "breakoutZones":["볼"], "environments":[], "routineContexts":[],
                  "concerns":["유분·번들거림", "장벽·각질"]
                }
                """;

        HttpResponse<String> saved = send("PUT", "/api/v1/users/me/skin-profile", token, profile);
        HttpResponse<String> loaded = send("GET", "/api/v1/users/me/skin-profile", token, null);
        assertThat(saved.statusCode()).isEqualTo(200);
        assertThat(loaded.statusCode()).isEqualTo(200);
        assertThat(saved.body()).contains("\"cheekOiliness\":\"LOW\"");
        assertThat(loaded.body()).contains(
                "\"cheekOiliness\":\"LOW\"",
                "\"concerns\":[\"유분·번들거림\",\"장벽·각질\"]"
        );
        assertThat(jdbc.queryForObject(
                "SELECT cheek_oiliness FROM user_skin_profiles WHERE user_id = ?",
                String.class,
                userId
        )).isEqualTo("LOW");

        String legacyUpdate = profile.replace("\n                  \"cheekOiliness\":\"LOW\",", "");
        HttpResponse<String> updated = send("PUT", "/api/v1/users/me/skin-profile", token, legacyUpdate);
        assertThat(updated.statusCode()).isEqualTo(200);
        assertThat(updated.body()).contains("\"cheekOiliness\":\"LOW\"");
    }

    private String validRecommendationPayload() {
        return """
                {
                  "profile": {
                    "skinType":"건성", "hydrationLevel":"LOW", "oilinessLevel":"LOW",
                    "sensitivityLevel":"MEDIUM", "breakoutFrequency":"OCCASIONAL",
                    "cleansingTightness":"SHORT", "rednessFrequency":"OCCASIONAL", "poreLevel":"MEDIUM",
                    "texturePreference":"BALANCED", "routineComplexity":"STANDARD", "sunscreenUsage":"DAILY",
                    "reactionTriggers":[], "breakoutZones":[], "environments":[], "routineContexts":[],
                    "concerns":["속건조·당김"]
                  },
                  "preferredIngredientIds":[], "limit":4
                }
                """;
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

    private HttpResponse<String> send(String method, String path, String token, String json) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (token != null) builder.header("Authorization", "Bearer " + token);
        if (json != null) builder.header("Content-Type", "application/json");
        return client.send(
                builder.method(
                        method,
                        json == null
                                ? HttpRequest.BodyPublishers.noBody()
                                : HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8)
                ).build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );
    }
}
