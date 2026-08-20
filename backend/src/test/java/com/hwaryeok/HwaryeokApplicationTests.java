package com.hwaryeok;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariDataSource;
import com.hwaryeok.product.ProductRepository;
import com.hwaryeok.user.User;
import com.hwaryeok.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class HwaryeokApplicationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void loadsApplicationAndSeedsProducts() {
        assertThat(productRepository.count()).isEqualTo(22);
    }

    @Test
    void usesOneApplicationManagedHikariConnectionPool() {
        assertThat(applicationContext.getBeansOfType(DataSource.class)).hasSize(1);
        assertThat(dataSource).isInstanceOf(HikariDataSource.class);

        HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
        assertThat(hikariDataSource.getPoolName()).isEqualTo("HwaryeokTestPool");
        assertThat(hikariDataSource.getMaximumPoolSize()).isEqualTo(3);
        assertThat(hikariDataSource.getMinimumIdle()).isEqualTo(1);
        assertThat(hikariDataSource.getLeakDetectionThreshold()).isEqualTo(60_000L);

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM products", Long.class)).isEqualTo(22L);
        assertThat(hikariDataSource.getHikariPoolMXBean().getActiveConnections()).isZero();
    }

    @Test
    void servesProductSearchApi() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/products?query=자작나무"))
                .GET()
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains(
                "\"content\"",
                "birch-cream",
                "hwahae-2079267",
                "hwahae-1920665",
                "자작나무 수분 크림",
                "\"scoreBasis\":\"성분 55% · 피부 적합 35% · 데이터 신뢰 10%\"",
                "\"totalElements\":3"
        );
    }

    @Test
    void servesSortedProductPages() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/products?page=1&size=2&sort=price&direction=asc"))
                .GET()
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"page\":1", "\"size\":2", "\"totalElements\":22", "\"totalPages\":11", "\"hasNext\":true");
        assertThat(response.body()).contains("hwahae-1918760", "hwahae-2015377").doesNotContain("rice-sunscreen");
        assertThat(response.body().indexOf("hwahae-1918760")).isLessThan(response.body().indexOf("hwahae-2015377"));
    }

    @Test
    void labelsUnavailableSourcePriceWithoutDisplayingZeroWon() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/products/hwahae-1899998"))
                .GET()
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body())
                .contains("hwahae-1899998", "\"priceValue\":0", "가격 정보 없음")
                .doesNotContain("\"price\":\"0원\"");
    }

    @Test
    void servesProductDetailAndSkinRankingApis() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest detailRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/products/birch-cream"))
                .GET()
                .build();
        HttpRequest rankingRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/products/ranking?skinType=%EB%AF%BC%EA%B0%90&limit=3"))
                .GET()
                .build();

        HttpResponse<String> detailResponse = client.send(detailRequest, HttpResponse.BodyHandlers.ofString());
        HttpResponse<String> rankingResponse = client.send(rankingRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(detailResponse.statusCode()).isEqualTo(200);
        assertThat(detailResponse.body()).contains("birch-cream", "수분 장벽 강화");
        assertThat(rankingResponse.statusCode()).isEqualTo(200);
        assertThat(rankingResponse.body()).contains("heartleaf-toner", "mugwort-ampoule", "bean-essence");
        assertThat(rankingResponse.body()).doesNotContain("hwahae-2015377");
    }

    @Test
    void servesPersonalAnalysisApi() throws Exception {
        String payload = """
                {
                  "productId": "birch-cream",
                  "skinType": "수부지",
                  "concerns": ["속건조", "민감", "피부 장벽"]
                }
                """;
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/analyses/preview"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains(
                "\"ingredientScore\"", "\"compatibilityScore\"", "\"dataConfidenceScore\"",
                "\"scoreBasis\":\"성분 55% · 피부 적합 35% · 데이터 신뢰 10%\"",
                "잘 맞는 편이에요"
        );
    }

    @Test
    void servesIngredientSearchAndDetailApis() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest searchRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/ingredients?query=%ED%8C%90%ED%85%8C%EB%86%80&status=GOOD&page=0&size=5"))
                .GET()
                .build();
        HttpRequest detailRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/ingredients/panthenol"))
                .GET()
                .build();

        HttpResponse<String> searchResponse = client.send(searchRequest, HttpResponse.BodyHandlers.ofString());
        HttpResponse<String> detailResponse = client.send(detailRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(searchResponse.statusCode()).isEqualTo(200);
        assertThat(searchResponse.body()).contains("\"totalElements\":1", "판테놀", "\"status\":\"GOOD\"");
        assertThat(detailResponse.statusCode()).isEqualTo(200);
        assertThat(detailResponse.body()).contains("Panthenol", "skinTypeFeatures", "concernFeatures", "birch-cream");
    }

    @Test
    void servesFilteredProductIngredientsApi() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/products/birch-cream/ingredients?tag=%EC%9E%A5%EB%B2%BD"))
                .GET()
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"totalCount\":4", "판테놀", "\"goodCount\":3", "\"cautionCount\":1");
        assertThat(response.body()).doesNotContain("자작나무 수액", "시어버터");
    }

    @Test
    void signsUpUserWithHashedPasswordAndRejectsDuplicateEmail() throws Exception {
        String payload = """
                {
                  "nickname": "새봄",
                  "email": "NewUser@Example.com",
                  "password": "Flower!123",
                  "passwordConfirm": "Flower!123",
                  "termsAccepted": true
                }
                """;
        HttpRequest signupRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/auth/signup"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> signupResponse = client.send(signupRequest, HttpResponse.BodyHandlers.ofString());
        HttpResponse<String> duplicateResponse = client.send(signupRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(signupResponse.statusCode()).isEqualTo(201);
        assertThat(signupResponse.body())
                .contains("newuser@example.com", "새봄", "\"nextStep\":\"SKIN_PROFILE\"")
                .doesNotContain("Flower!123", "passwordHash");

        User storedUser = userRepository.findByEmail("newuser@example.com").orElseThrow();
        assertThat(storedUser.getPasswordHash()).isNotEqualTo("Flower!123").startsWith("$2");
        assertThat(passwordEncoder.matches("Flower!123", storedUser.getPasswordHash())).isTrue();

        assertThat(duplicateResponse.statusCode()).isEqualTo(409);
        assertThat(duplicateResponse.body()).contains("DUPLICATE_EMAIL", "이미 가입된 이메일이에요.");
    }

    @Test
    void rejectsInvalidSignupInput() throws Exception {
        String payload = """
                {
                  "nickname": "봄",
                  "email": "not-an-email",
                  "password": "short",
                  "passwordConfirm": "different",
                  "termsAccepted": false
                }
                """;
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/auth/signup"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.body()).contains("VALIDATION_FAILED", "nickname", "email", "password", "termsAccepted");
    }

    @Test
    void exposesOAuthProvidersAndProtectsCurrentSession() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest providersRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/auth/oauth/providers"))
                .GET()
                .build();
        HttpRequest sessionRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/auth/me"))
                .GET()
                .build();

        HttpResponse<String> providersResponse = client.send(providersRequest, HttpResponse.BodyHandlers.ofString());
        HttpResponse<String> sessionResponse = client.send(sessionRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(providersResponse.statusCode()).isEqualTo(200);
        assertThat(providersResponse.body())
                .contains("\"id\":\"google\"", "\"id\":\"kakao\"", "\"id\":\"naver\"")
                .contains("\"configured\":");
        assertThat(sessionResponse.statusCode()).isEqualTo(401);
    }

    @Test
    void logsInRefreshesRotatesAndRevokesSessionTokens() throws Exception {
        Instant now = Instant.now();
        userRepository.findByEmail("session@example.com").orElseGet(() -> userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(),
                "session@example.com",
                passwordEncoder.encode("Flower!123"),
                "세션봄",
                "USER",
                "ACTIVE",
                now,
                now
        )));

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest loginRequest = jsonPost("/api/v1/auth/login", """
                {"email":"SESSION@EXAMPLE.COM","password":"Flower!123"}
                """);
        HttpResponse<String> loginResponse = client.send(loginRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(loginResponse.statusCode()).isEqualTo(200);
        assertThat(loginResponse.body()).contains("\"tokenType\":\"Bearer\"", "session@example.com", "\"authMethod\":\"password\"");
        String accessToken = jsonString(loginResponse.body(), "accessToken");
        String refreshToken = jsonString(loginResponse.body(), "refreshToken");

        HttpRequest meRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/auth/me"))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();
        HttpResponse<String> meResponse = client.send(meRequest, HttpResponse.BodyHandlers.ofString());
        assertThat(meResponse.statusCode()).isEqualTo(200);
        assertThat(meResponse.body()).contains("session@example.com", "세션봄", "\"authMethod\":\"password\"");

        HttpResponse<String> refreshResponse = client.send(
                jsonPost("/api/v1/auth/refresh", "{\"refreshToken\":\"" + refreshToken + "\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(refreshResponse.statusCode()).isEqualTo(200);
        String rotatedRefreshToken = jsonString(refreshResponse.body(), "refreshToken");
        assertThat(rotatedRefreshToken).isNotEqualTo(refreshToken);

        HttpResponse<String> reusedResponse = client.send(
                jsonPost("/api/v1/auth/refresh", "{\"refreshToken\":\"" + refreshToken + "\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(reusedResponse.statusCode()).isEqualTo(401);
        assertThat(reusedResponse.body()).contains("INVALID_REFRESH_TOKEN");

        HttpResponse<String> revokedFamilyResponse = client.send(
                jsonPost("/api/v1/auth/refresh", "{\"refreshToken\":\"" + rotatedRefreshToken + "\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(revokedFamilyResponse.statusCode()).isEqualTo(401);
    }

    @Test
    void rejectsInvalidLoginWithoutRevealingWhichFieldFailed() throws Exception {
        HttpResponse<String> response = HttpClient.newHttpClient().send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"missing@example.com\",\"password\":\"Wrong!123\"}"),
                HttpResponse.BodyHandlers.ofString()
        );

        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(response.body()).contains("INVALID_CREDENTIALS", "이메일 또는 비밀번호를 확인해 주세요.");
    }

    @Test
    void rateLimitsRepeatedInvalidLogins() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        String email = "rate-limit-" + UUID.randomUUID() + "@example.com";
        for (int attempt = 0; attempt < 8; attempt++) {
            HttpResponse<String> response = client.send(
                    jsonPost("/api/v1/auth/login", "{\"email\":\"" + email + "\",\"password\":\"Wrong!123\"}"),
                    HttpResponse.BodyHandlers.ofString()
            );
            assertThat(response.statusCode()).isEqualTo(401);
        }

        HttpResponse<String> blocked = client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"" + email + "\",\"password\":\"Wrong!123\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(blocked.statusCode()).isEqualTo(429);
        assertThat(blocked.body()).contains("TOO_MANY_LOGIN_ATTEMPTS");
        assertThat(blocked.headers().firstValue("Retry-After")).isPresent();
    }

    @Test
    void allowsOnlyOneConcurrentRefreshRotation() throws Exception {
        Instant now = Instant.now();
        String email = "concurrent-refresh-" + UUID.randomUUID() + "@example.com";
        userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(),
                email,
                passwordEncoder.encode("Flower!123"),
                "동시성봄",
                "USER",
                "ACTIVE",
                now,
                now
        ));
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> login = client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"" + email + "\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        String refreshToken = jsonString(login.body(), "refreshToken");
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var requests = List.of(1, 2).stream()
                    .map(ignored -> executor.submit(() -> {
                        ready.countDown();
                        start.await();
                        return client.send(
                                jsonPost("/api/v1/auth/refresh", "{\"refreshToken\":\"" + refreshToken + "\"}"),
                                HttpResponse.BodyHandlers.ofString()
                        );
                    }))
                    .toList();
            ready.await();
            start.countDown();
            var first = requests.get(0).get();
            var second = requests.get(1).get();
            assertThat(List.of(first.statusCode(), second.statusCode()))
                    .containsExactlyInAnyOrder(200, 401);
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void rollsBackWholeProfileWhenPreferredIngredientSaveFails() throws Exception {
        Instant now = Instant.now();
        String email = "atomic-profile-" + UUID.randomUUID() + "@example.com";
        userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(),
                email,
                passwordEncoder.encode("Flower!123"),
                "원자성봄",
                "USER",
                "ACTIVE",
                now,
                now
        ));
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> login = client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"" + email + "\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        String accessToken = jsonString(login.body(), "accessToken");
        String payload = """
                {
                  "skinProfile": {
                    "skinType":"건성","hydrationLevel":"LOW","oilinessLevel":"LOW",
                    "sensitivityLevel":"LOW","breakoutFrequency":"RARE","cleansingTightness":"SHORT",
                    "rednessFrequency":"RARE","poreLevel":"LOW","texturePreference":"RICH",
                    "routineComplexity":"MINIMAL","sunscreenUsage":"DAILY","reactionTriggers":[],
                    "breakoutZones":[],"environments":[],"concerns":["속건조"]
                  },
                  "ingredientIds":["missing-ingredient"]
                }
                """;
        HttpResponse<String> failed = client.send(
                bearerRequest("PUT", "/api/v1/users/me/profile", accessToken, payload),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(failed.statusCode()).isEqualTo(400);
        assertThat(failed.body()).contains("등록되지 않은 성분");

        HttpResponse<String> profile = client.send(
                bearerRequest("GET", "/api/v1/users/me/skin-profile", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(profile.statusCode()).isEqualTo(200);
        assertThat(profile.body()).contains("\"configured\":false");
    }

    @Test
    void savesAndUpdatesAuthenticatedUserSkinProfile() throws Exception {
        Instant now = Instant.now();
        userRepository.findByEmail("profile@example.com").orElseGet(() -> userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(),
                "profile@example.com",
                passwordEncoder.encode("Flower!123"),
                "프로필봄",
                "USER",
                "ACTIVE",
                now,
                now
        )));

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> loginResponse = client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"profile@example.com\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        String accessToken = jsonString(loginResponse.body(), "accessToken");

        HttpResponse<String> emptyResponse = client.send(
                bearerRequest("GET", "/api/v1/users/me/skin-profile", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(emptyResponse.statusCode()).isEqualTo(200);
        assertThat(emptyResponse.body()).contains("\"configured\":false", "\"concerns\":[]");

        HttpResponse<String> createResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/skin-profile", accessToken,
                        "{\"skinType\":\"수부지\",\"hydrationLevel\":\"LOW\",\"oilinessLevel\":\"HIGH\",\"sensitivityLevel\":\"HIGH\",\"breakoutFrequency\":\"OCCASIONAL\",\"cleansingTightness\":\"LONG\",\"rednessFrequency\":\"FREQUENT\",\"poreLevel\":\"MEDIUM\",\"texturePreference\":\"LIGHT\",\"routineComplexity\":\"STANDARD\",\"sunscreenUsage\":\"DAILY\",\"reactionTriggers\":[\"향료\",\"에탄올\"],\"breakoutZones\":[\"턱·입가\"],\"environments\":[\"냉난방 건조\",\"계절 변화\"],\"concerns\":[\"속건조\",\"민감\",\"피부 장벽\"]}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(createResponse.statusCode()).isEqualTo(200);
        assertThat(createResponse.body()).contains(
                "\"configured\":true",
                "\"skinType\":\"수부지\"",
                "\"hydrationLevel\":\"LOW\"",
                "\"oilinessLevel\":\"HIGH\"",
                "\"sensitivityLevel\":\"HIGH\"",
                "\"breakoutFrequency\":\"OCCASIONAL\"",
                "\"profileVersion\":2",
                "\"cleansingTightness\":\"LONG\"",
                "\"rednessFrequency\":\"FREQUENT\"",
                "\"texturePreference\":\"LIGHT\"",
                "\"reactionTriggers\":[\"향료\",\"에탄올\"]",
                "\"breakoutZones\":[\"턱·입가\"]",
                "\"environments\":[\"냉난방 건조\",\"계절 변화\"]",
                "\"concerns\":[\"속건조\",\"민감\",\"피부 장벽\"]"
        );

        HttpResponse<String> updateResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/skin-profile", accessToken,
                        "{\"skinType\":\"건성\",\"hydrationLevel\":\"LOW\",\"oilinessLevel\":\"LOW\",\"sensitivityLevel\":\"MEDIUM\",\"breakoutFrequency\":\"RARE\",\"cleansingTightness\":\"SHORT\",\"rednessFrequency\":\"RARE\",\"poreLevel\":\"LOW\",\"texturePreference\":\"RICH\",\"routineComplexity\":\"MINIMAL\",\"sunscreenUsage\":\"SOMETIMES\",\"reactionTriggers\":[],\"breakoutZones\":[],\"environments\":[\"수면 부족\"],\"concerns\":[\"각질\",\"탄력\"]}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(updateResponse.statusCode()).isEqualTo(200);
        assertThat(updateResponse.body())
                .contains("\"skinType\":\"건성\"", "\"hydrationLevel\":\"LOW\"", "\"oilinessLevel\":\"LOW\"", "\"sensitivityLevel\":\"MEDIUM\"", "\"breakoutFrequency\":\"RARE\"", "\"texturePreference\":\"RICH\"", "\"reactionTriggers\":[]", "\"environments\":[\"수면 부족\"]", "\"concerns\":[\"각질\",\"탄력\"]")
                .doesNotContain("속건조", "피부 장벽", "냉난방 건조");

        HttpResponse<String> readResponse = client.send(
                bearerRequest("GET", "/api/v1/users/me/skin-profile", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(readResponse.statusCode()).isEqualTo(200);
        assertThat(readResponse.body()).contains("\"skinType\":\"건성\"", "\"hydrationLevel\":\"LOW\"", "\"oilinessLevel\":\"LOW\"", "\"sensitivityLevel\":\"MEDIUM\"", "\"breakoutFrequency\":\"RARE\"", "\"texturePreference\":\"RICH\"", "\"environments\":[\"수면 부족\"]", "\"concerns\":[\"각질\",\"탄력\"]");
    }

    @Test
    void protectsAndValidatesSkinProfileApi() throws Exception {
        Instant now = Instant.now();
        userRepository.findByEmail("profile@example.com").orElseGet(() -> userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(),
                "profile@example.com",
                passwordEncoder.encode("Flower!123"),
                "프로필봄",
                "USER",
                "ACTIVE",
                now,
                now
        )));
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> unauthorizedResponse = client.send(
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + port + "/api/v1/users/me/skin-profile"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(unauthorizedResponse.statusCode()).isEqualTo(401);

        HttpResponse<String> loginResponse = client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"profile@example.com\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        String accessToken = jsonString(loginResponse.body(), "accessToken");
        HttpResponse<String> invalidResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/skin-profile", accessToken,
                        "{\"skinType\":\"건성\",\"concerns\":[\"속건조\",\"속건조\"]}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(invalidResponse.statusCode()).isEqualTo(400);
        assertThat(invalidResponse.body()).contains("INVALID_REQUEST", "중복해서 선택할 수 없어요");

        HttpResponse<String> invalidDetailResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/skin-profile", accessToken,
                        "{\"skinType\":\"건성\",\"hydrationLevel\":\"UNKNOWN\",\"oilinessLevel\":\"BALANCED\",\"sensitivityLevel\":\"MEDIUM\",\"breakoutFrequency\":\"OCCASIONAL\",\"concerns\":[\"속건조\"]}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(invalidDetailResponse.statusCode()).isEqualTo(400);
        assertThat(invalidDetailResponse.body()).contains("VALIDATION_FAILED", "수분 상태를 다시 선택해 주세요");
    }

    @Test
    void addsListsAndRemovesAuthenticatedUserFavorites() throws Exception {
        Instant now = Instant.now();
        userRepository.findByEmail("favorite@example.com").orElseGet(() -> userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(),
                "favorite@example.com",
                passwordEncoder.encode("Flower!123"),
                "찜회원",
                "USER",
                "ACTIVE",
                now,
                now
        )));

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> unauthorizedResponse = client.send(
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + port + "/api/v1/users/me/favorites"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(unauthorizedResponse.statusCode()).isEqualTo(401);

        HttpResponse<String> loginResponse = client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"favorite@example.com\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        String accessToken = jsonString(loginResponse.body(), "accessToken");

        HttpResponse<String> addResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/favorites/birch-cream", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> duplicateResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/favorites/birch-cream", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> listResponse = client.send(
                bearerRequest("GET", "/api/v1/users/me/favorites", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );

        assertThat(addResponse.statusCode()).isEqualTo(200);
        assertThat(addResponse.body()).contains("birch-cream", "favoritedAt");
        assertThat(duplicateResponse.statusCode()).isEqualTo(200);
        assertThat(listResponse.statusCode()).isEqualTo(200);
        assertThat(listResponse.body()).contains("\"totalElements\":1", "자작나무 수분 크림");

        HttpResponse<String> missingProductResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/favorites/not-a-product", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(missingProductResponse.statusCode()).isEqualTo(404);
        assertThat(missingProductResponse.body()).contains("RESOURCE_NOT_FOUND");

        HttpResponse<String> deleteResponse = client.send(
                bearerRequest("DELETE", "/api/v1/users/me/favorites/birch-cream", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> emptyResponse = client.send(
                bearerRequest("GET", "/api/v1/users/me/favorites", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(deleteResponse.statusCode()).isEqualTo(204);
        assertThat(emptyResponse.body()).contains("\"content\":[]", "\"totalElements\":0");
    }

    @Test
    void createsCategoryReviewAndReturnsCalculatedSummary() throws Exception {
        Instant now = Instant.now();
        userRepository.findByEmail("review@example.com").orElseGet(() -> userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(),
                "review@example.com",
                passwordEncoder.encode("Flower!123"),
                "리뷰회원",
                "USER",
                "ACTIVE",
                now,
                now
        )));

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> criteriaResponse = client.send(
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + port + "/api/v1/products/birch-cream/review-criteria"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(criteriaResponse.statusCode()).isEqualTo(200);
        assertThat(criteriaResponse.body()).contains(
                "\"categoryId\":\"MOISTURIZER\"",
                "\"categoryName\":\"수분크림\"",
                "\"templateVersion\":1",
                "보습력",
                "가격 만족도"
        );

        String reviewPayload = """
                {
                  "content": "한 달 동안 사용해 보니 촉촉함은 오래가고 마무리감도 편안했어요.",
                  "skinType": "건성",
                  "usagePeriod": "ONE_MONTH",
                  "repurchaseYn": true,
                  "scores": [
                    {"criteriaId":"moisture","score":5},
                    {"criteriaId":"spread","score":4},
                    {"criteriaId":"absorption","score":4},
                    {"criteriaId":"lasting","score":4},
                    {"criteriaId":"freshness","score":4},
                    {"criteriaId":"low-irritation","score":5},
                    {"criteriaId":"ingredient","score":4},
                    {"criteriaId":"price","score":2}
                  ]
                }
                """;
        HttpResponse<String> unauthorizedResponse = client.send(
                jsonPost("/api/v1/products/birch-cream/reviews", reviewPayload),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(unauthorizedResponse.statusCode()).isEqualTo(401);

        String accessToken = jsonString(client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"review@example.com\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()
        ).body(), "accessToken");
        HttpResponse<String> createResponse = client.send(
                bearerRequest("POST", "/api/v1/products/birch-cream/reviews", accessToken, reviewPayload),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(createResponse.statusCode()).isEqualTo(201);
        assertThat(createResponse.body()).contains("\"totalScore\":80.00", "리뷰회원", "\"skinType\":\"건성\"");

        HttpResponse<String> summaryResponse = client.send(
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + port + "/api/v1/products/birch-cream/reviews"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(summaryResponse.statusCode()).isEqualTo(200);
        assertThat(summaryResponse.body()).contains(
                "\"reviewScore\":80.0",
                "\"reviewCount\":1",
                "\"rankingStatus\":\"COLLECTING\"",
                "\"minimumOfficialReviewCount\":50",
                "\"averageScore\":5.0",
                "한 달 동안 사용해 보니"
        );

        HttpResponse<String> duplicateResponse = client.send(
                bearerRequest("POST", "/api/v1/products/birch-cream/reviews", accessToken, reviewPayload),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(duplicateResponse.statusCode()).isEqualTo(409);
        assertThat(duplicateResponse.body()).contains("REVIEW_ALREADY_EXISTS");
    }

    @Test
    void recordsAndListsAuthenticatedUserRecentProductsWithoutDuplicates() throws Exception {
        Instant now = Instant.now();
        userRepository.findByEmail("recent@example.com").orElseGet(() -> userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(),
                "recent@example.com",
                passwordEncoder.encode("Flower!123"),
                "최근회원",
                "USER",
                "ACTIVE",
                now,
                now
        )));

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> unauthorizedResponse = client.send(
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + port + "/api/v1/users/me/recent-products"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(unauthorizedResponse.statusCode()).isEqualTo(401);

        String accessToken = jsonString(client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"recent@example.com\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()
        ).body(), "accessToken");

        HttpResponse<String> firstResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/recent-products/birch-cream", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> secondResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/recent-products/heartleaf-toner", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> duplicateResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/recent-products/birch-cream", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> listResponse = client.send(
                bearerRequest("GET", "/api/v1/users/me/recent-products", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );

        assertThat(firstResponse.statusCode()).isEqualTo(200);
        assertThat(secondResponse.statusCode()).isEqualTo(200);
        assertThat(duplicateResponse.statusCode()).isEqualTo(200);
        assertThat(duplicateResponse.body()).contains("birch-cream", "viewedAt");
        assertThat(listResponse.statusCode()).isEqualTo(200);
        assertThat(listResponse.body()).contains("\"totalElements\":2", "자작나무 수분 크림", "어성초 77 진정 토너");
        assertThat(listResponse.body().indexOf("birch-cream"))
                .isLessThan(listResponse.body().indexOf("heartleaf-toner"));

        HttpResponse<String> missingProductResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/recent-products/not-a-product", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(missingProductResponse.statusCode()).isEqualTo(404);
        assertThat(missingProductResponse.body()).contains("RESOURCE_NOT_FOUND");
    }

    @Test
    void savesTwoOrThreeComparisonProductsInUserOrder() throws Exception {
        Instant now = Instant.now();
        userRepository.findByEmail("comparison@example.com").orElseGet(() -> userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(),
                "comparison@example.com",
                passwordEncoder.encode("Flower!123"),
                "비교회원",
                "USER",
                "ACTIVE",
                now,
                now
        )));

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> unauthorizedResponse = client.send(
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + port + "/api/v1/users/me/comparison-products"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(unauthorizedResponse.statusCode()).isEqualTo(401);

        String accessToken = jsonString(client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"comparison@example.com\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()
        ).body(), "accessToken");

        HttpResponse<String> saveResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/comparison-products", accessToken,
                        "{\"productIds\":[\"birch-cream\",\"heartleaf-toner\",\"rice-sunscreen\"]}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(saveResponse.statusCode()).isEqualTo(200);
        assertThat(saveResponse.body()).contains("\"totalElements\":3", "\"displayOrder\":1", "\"displayOrder\":3");
        assertThat(saveResponse.body().indexOf("birch-cream"))
                .isLessThan(saveResponse.body().indexOf("heartleaf-toner"));
        assertThat(saveResponse.body().indexOf("heartleaf-toner"))
                .isLessThan(saveResponse.body().indexOf("rice-sunscreen"));

        HttpResponse<String> replaceResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/comparison-products", accessToken,
                        "{\"productIds\":[\"rice-sunscreen\",\"birch-cream\"]}"),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> listResponse = client.send(
                bearerRequest("GET", "/api/v1/users/me/comparison-products", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(replaceResponse.statusCode()).isEqualTo(200);
        assertThat(listResponse.body()).contains("\"totalElements\":2", "rice-sunscreen", "birch-cream")
                .doesNotContain("heartleaf-toner");
        assertThat(listResponse.body().indexOf("rice-sunscreen"))
                .isLessThan(listResponse.body().indexOf("birch-cream"));

        HttpResponse<String> duplicateResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/comparison-products", accessToken,
                        "{\"productIds\":[\"birch-cream\",\"birch-cream\"]}"),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> tooFewResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/comparison-products", accessToken,
                        "{\"productIds\":[\"birch-cream\"]}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(duplicateResponse.statusCode()).isEqualTo(400);
        assertThat(duplicateResponse.body()).contains("INVALID_REQUEST", "중복해서 비교할 수 없어요");
        assertThat(tooFewResponse.statusCode()).isEqualTo(400);
        assertThat(tooFewResponse.body()).contains("VALIDATION_FAILED", "2개 또는 3개");

        HttpResponse<String> clearResponse = client.send(
                bearerRequest("DELETE", "/api/v1/users/me/comparison-products", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> emptyResponse = client.send(
                bearerRequest("GET", "/api/v1/users/me/comparison-products", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(clearResponse.statusCode()).isEqualTo(204);
        assertThat(emptyResponse.body()).contains("\"content\":[]", "\"totalElements\":0");
    }

    @Test
    void ranksProductsByIngredientFirepowerWithBreakdown() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> featuredResponse = client.send(
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + port + "/api/v1/ingredients/featured?limit=3"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> firepowerResponse = client.send(
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + port + "/api/v1/ingredients/panthenol/firepower"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString()
        );

        assertThat(featuredResponse.statusCode()).isEqualTo(200);
        assertThat(featuredResponse.body()).contains("판테놀", "나이아신아마이드", "세라마이드 NP", "\"evidenceLevel\":\"A\"");
        assertThat(firepowerResponse.statusCode()).isEqualTo(200);
        assertThat(firepowerResponse.body()).contains(
                "ingredient-firepower-v1", "birch-cream", "firepowerScore", "breakdown", "dataConfidence", "의학적 효능을 보장하지 않아요"
        );
    }

    @Test
    void savesAuthenticatedUserPreferredIngredientsInPriorityOrder() throws Exception {
        Instant now = Instant.now();
        userRepository.findByEmail("ingredient@example.com").orElseGet(() -> userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(),
                "ingredient@example.com",
                passwordEncoder.encode("Flower!123"),
                "성분회원",
                "USER",
                "ACTIVE",
                now,
                now
        )));
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> loginResponse = client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"ingredient@example.com\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        String accessToken = jsonString(loginResponse.body(), "accessToken");

        HttpResponse<String> saveResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/preferred-ingredients", accessToken,
                        "{\"ingredientIds\":[\"niacinamide\",\"panthenol\",\"ceramide-np\"]}"),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> readResponse = client.send(
                bearerRequest("GET", "/api/v1/users/me/preferred-ingredients", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );

        assertThat(saveResponse.statusCode()).isEqualTo(200);
        assertThat(readResponse.statusCode()).isEqualTo(200);
        assertThat(readResponse.body()).contains("\"totalElements\":3", "\"priority\":1", "나이아신아마이드");
        assertThat(readResponse.body().indexOf("niacinamide")).isLessThan(readResponse.body().indexOf("panthenol"));
        assertThat(readResponse.body().indexOf("panthenol")).isLessThan(readResponse.body().indexOf("ceramide-np"));
    }

    @Test
    void onlyAdminCanUploadAndPublicCanReadProductImage() throws Exception {
        Instant now = Instant.now();
        userRepository.findByEmail("image-user@example.com").orElseGet(() -> userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(), "image-user@example.com", passwordEncoder.encode("Flower!123"),
                "일반회원", "USER", "ACTIVE", now, now
        )));
        userRepository.findByEmail("image-admin@example.com").orElseGet(() -> userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(), "image-admin@example.com", passwordEncoder.encode("Flower!123"),
                "이미지관리자", "ADMIN", "ACTIVE", now, now
        )));

        HttpClient client = HttpClient.newHttpClient();
        String userToken = jsonString(client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"image-user@example.com\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()).body(), "accessToken");
        String adminToken = jsonString(client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"image-admin@example.com\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()).body(), "accessToken");

        HttpResponse<String> forbiddenResponse = client.send(
                bearerRequest("PUT", "/api/v1/admin/products/birch-cream/image", userToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(forbiddenResponse.statusCode()).isEqualTo(403);

        String boundary = "HwaryeokImageBoundary";
        byte[] png = Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");
        ByteArrayOutputStream multipart = new ByteArrayOutputStream();
        multipart.write(("--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"file\"; filename=\"birch.png\"\r\n"
                + "Content-Type: image/png\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        multipart.write(png);
        multipart.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        HttpRequest uploadRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/admin/products/birch-cream/image"))
                .header("Authorization", "Bearer " + adminToken)
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .PUT(HttpRequest.BodyPublishers.ofByteArray(multipart.toByteArray()))
                .build();

        HttpResponse<String> uploadResponse = client.send(uploadRequest, HttpResponse.BodyHandlers.ofString());
        HttpResponse<byte[]> imageResponse = client.send(
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + port + "/api/v1/media/products/birch-cream"))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofByteArray()
        );

        assertThat(uploadResponse.statusCode()).isEqualTo(200);
        assertThat(uploadResponse.body()).contains("\"imageUrl\":\"/api/v1/media/products/birch-cream\"");
        assertThat(imageResponse.statusCode()).isEqualTo(200);
        assertThat(imageResponse.headers().firstValue("Content-Type")).contains("image/png");
        assertThat(imageResponse.body()).isEqualTo(png);
    }

    @Test
    void servesVerifiedExpertsQuestionsAndContributionRanking() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> expertsResponse = client.send(
                HttpRequest.newBuilder().uri(URI.create("http://localhost:" + port + "/api/v1/experts")).GET().build(),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> detailResponse = client.send(
                HttpRequest.newBuilder().uri(URI.create("http://localhost:" + port + "/api/v1/experts/seo-yuna")).GET().build(),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> rankingResponse = client.send(
                HttpRequest.newBuilder().uri(URI.create("http://localhost:" + port + "/api/v1/experts/rankings?period=MONTH&topic=BARRIER")).GET().build(),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> questionsResponse = client.send(
                HttpRequest.newBuilder().uri(URI.create("http://localhost:" + port + "/api/v1/questions")).GET().build(),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> openQuestionsResponse = client.send(
                HttpRequest.newBuilder().uri(URI.create("http://localhost:" + port + "/api/v1/questions?status=OPEN")).GET().build(),
                HttpResponse.BodyHandlers.ofString()
        );

        assertThat(expertsResponse.statusCode()).isEqualTo(200);
        assertThat(expertsResponse.body()).contains("서유나", "김도현", "이하린", "doctorVerified", "workplace");
        assertThat(detailResponse.statusCode()).isEqualTo(200);
        assertThat(detailResponse.body()).contains("피부과 전문의", "봄결피부과의원", "recentAnswers");
        assertThat(rankingResponse.statusCode()).isEqualTo(200);
        assertThat(rankingResponse.body()).contains("\"period\":\"MONTH\"", "\"topic\":\"BARRIER\"", "의학적 실력이나 치료 결과를 평가하지 않습니다");
        assertThat(questionsResponse.statusCode()).isEqualTo(200);
        assertThat(questionsResponse.body()).contains("세라마이드 크림은 매일 발라도 괜찮을까요?", "answerCount");
        assertThat(openQuestionsResponse.statusCode()).isEqualTo(200);
        assertThat(openQuestionsResponse.body()).contains("판테놀 제품을 고를 때 함량이 가장 중요한가요?").doesNotContain("세라마이드 크림은 매일 발라도 괜찮을까요?");
    }

    @Test
    void supportsExpertApplicationApprovalAnswerAndQuestionEngagement() throws Exception {
        Instant now = Instant.now();
        userRepository.findByEmail("expert-flow@example.com").orElseGet(() -> userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(), "expert-flow@example.com", passwordEncoder.encode("Flower!123"),
                "전문가흐름", "USER", "ACTIVE", now, now
        )));
        userRepository.findByEmail("expert-admin@example.com").orElseGet(() -> userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(), "expert-admin@example.com", passwordEncoder.encode("Flower!123"),
                "전문가관리자", "ADMIN", "ACTIVE", now, now
        )));
        HttpClient client = HttpClient.newHttpClient();
        String expertToken = jsonString(client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"expert-flow@example.com\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()).body(), "accessToken");
        String adminToken = jsonString(client.send(
                jsonPost("/api/v1/auth/login", "{\"email\":\"expert-admin@example.com\",\"password\":\"Flower!123\"}"),
                HttpResponse.BodyHandlers.ofString()).body(), "accessToken");

        String applicationPayload = """
                {
                  "realName":"윤해봄",
                  "licenseNumber":"MD-2026-12345",
                  "specialistRequested":true,
                  "specialty":"피부과 전문의",
                  "topics":["BARRIER","INGREDIENT"],
                  "bio":"피부 장벽과 화장품 성분을 근거 중심으로 설명합니다.",
                  "workplace":{"hospitalName":"해봄피부과","region":"서울 종로구","address":"서울특별시 종로구 봄길 1","phone":"02-123-4567"}
                }
                """;
        HttpResponse<String> applicationResponse = client.send(
                bearerRequest("POST", "/api/v1/experts/me/application", expertToken, applicationPayload),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(applicationResponse.statusCode()).isEqualTo(200);
        assertThat(applicationResponse.body()).contains("윤해봄", "\"status\":\"PENDING\"", "해봄피부과").doesNotContain("MD-2026-12345");
        String expertId = jsonString(applicationResponse.body(), "id");

        HttpResponse<String> forbiddenAnswerResponse = client.send(
                bearerRequest("POST", "/api/v1/expert/questions/question-panthenol/answers", expertToken,
                        "{\"content\":\"인증 전에는 등록될 수 없는 충분히 긴 전문가 답변입니다.\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(forbiddenAnswerResponse.statusCode()).isEqualTo(403);

        HttpResponse<String> approveResponse = client.send(
                bearerRequest("PUT", "/api/v1/admin/experts/" + expertId + "/verification", adminToken,
                        "{\"status\":\"VERIFIED\",\"doctorVerified\":true,\"specialistVerified\":true,\"workplaceVerified\":true}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(approveResponse.statusCode()).isEqualTo(200);
        assertThat(approveResponse.body()).contains("\"status\":\"VERIFIED\"", "\"verified\":true");

        HttpResponse<String> questionResponse = client.send(
                bearerRequest("POST", "/api/v1/users/me/questions", expertToken,
                        "{\"title\":\"민감 피부의 판테놀 사용법이 궁금해요\",\"content\":\"판테놀 제품을 처음 사용할 때 빈도와 주의점을 알고 싶습니다.\",\"skinType\":\"민감성\",\"ingredientId\":\"panthenol\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(questionResponse.statusCode()).isEqualTo(200);
        String questionId = jsonString(questionResponse.body(), "id");

        HttpResponse<String> answerResponse = client.send(
                bearerRequest("POST", "/api/v1/expert/questions/" + questionId + "/answers", expertToken,
                        "{\"content\":\"처음에는 좁은 부위에 낮은 빈도로 사용해 반응을 살피고, 붉어짐이나 따가움이 지속되면 사용을 중단하세요.\"}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(answerResponse.statusCode()).isEqualTo(200);
        String answerId = jsonString(answerResponse.body(), "id");

        HttpResponse<String> helpfulResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/expert-answers/" + answerId + "/helpful", expertToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> duplicateHelpfulResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/expert-answers/" + answerId + "/helpful", expertToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        HttpResponse<String> adoptResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/questions/" + questionId + "/adopt/" + answerId, expertToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(helpfulResponse.statusCode()).isEqualTo(200);
        assertThat(helpfulResponse.body()).contains("\"helpfulCount\":1", "\"viewerHelpful\":true");
        assertThat(duplicateHelpfulResponse.body()).contains("\"helpfulCount\":1");
        assertThat(adoptResponse.statusCode()).isEqualTo(200);
        assertThat(adoptResponse.body()).contains("\"adopted\":true");
    }

    private HttpRequest jsonPost(String path, String payload) {
        return HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();
    }

    private HttpRequest bearerRequest(String method, String path, String accessToken, String payload) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .header("Authorization", "Bearer " + accessToken);
        if (payload != null) {
            builder.header("Content-Type", "application/json")
                    .method(method, HttpRequest.BodyPublishers.ofString(payload));
        } else {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        }
        return builder.build();
    }

    private String jsonString(String json, String field) {
        Matcher matcher = Pattern.compile("\\\"" + Pattern.quote(field) + "\\\":\\\"([^\\\"]+)\\\"").matcher(json);
        assertThat(matcher.find()).as("JSON field %s", field).isTrue();
        return matcher.group(1);
    }
}
