package com.hwaryeok;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.hwaryeok.product.ProductRepository;
import com.hwaryeok.user.User;
import com.hwaryeok.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
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

    @Test
    void loadsApplicationAndSeedsProducts() {
        assertThat(productRepository.count()).isEqualTo(22);
    }

    @Test
    void servesProductSearchApi() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/products?query=자작나무&grade=1"))
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
                "\"grade\":1",
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
        assertThat(rankingResponse.body()).contains("hwahae-2015377", "hwahae-1950255", "birch-cream");
        assertThat(rankingResponse.body()).doesNotContain("mugwort-ampoule");
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
        assertThat(response.body()).contains("\"grade\":1", "\"score\":100", "매우 잘 맞아요");
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
                        "{\"skinType\":\"수부지\",\"concerns\":[\"속건조\",\"민감\",\"피부 장벽\"]}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(createResponse.statusCode()).isEqualTo(200);
        assertThat(createResponse.body()).contains(
                "\"configured\":true",
                "\"skinType\":\"수부지\"",
                "\"concerns\":[\"속건조\",\"민감\",\"피부 장벽\"]"
        );

        HttpResponse<String> updateResponse = client.send(
                bearerRequest("PUT", "/api/v1/users/me/skin-profile", accessToken,
                        "{\"skinType\":\"건성\",\"concerns\":[\"각질\",\"탄력\"]}"),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(updateResponse.statusCode()).isEqualTo(200);
        assertThat(updateResponse.body())
                .contains("\"skinType\":\"건성\"", "\"concerns\":[\"각질\",\"탄력\"]")
                .doesNotContain("속건조", "피부 장벽");

        HttpResponse<String> readResponse = client.send(
                bearerRequest("GET", "/api/v1/users/me/skin-profile", accessToken, null),
                HttpResponse.BodyHandlers.ofString()
        );
        assertThat(readResponse.statusCode()).isEqualTo(200);
        assertThat(readResponse.body()).contains("\"skinType\":\"건성\"", "\"concerns\":[\"각질\",\"탄력\"]");
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
