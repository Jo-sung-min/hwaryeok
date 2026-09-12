package com.hwaryeok.product;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

import com.hwaryeok.user.ActivityNickname;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.datasource.url=jdbc:h2:mem:product-filter-http;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"
)
class ProductFilterHttpTest {

    private static final String INGREDIENT_ID = "product-filter-http-ingredient";

    @LocalServerPort private int port;
    @Autowired private JdbcTemplate jdbc;

    @BeforeEach
    void setUp() {
        jdbc.update("DELETE FROM products WHERE id LIKE 'product-filter-http-%'");
        jdbc.update("DELETE FROM users WHERE email LIKE 'product-filter-http-%@example.com'");
        jdbc.update("DELETE FROM ingredients WHERE id = ?", INGREDIENT_ID);

        jdbc.update("""
                INSERT INTO ingredients
                    (id, name, english_name, role, description, status, evidence_level, featured, display_order)
                VALUES (?, '상품 필터 테스트 성분', 'Product filter test ingredient', '진정', '테스트', 'GOOD', 'A', FALSE, 900)
                """, INGREDIENT_ID);
        jdbc.update("""
                INSERT INTO ingredient_concern_features (ingredient_id, concern, feature)
                VALUES (?, '탄력', '잔주름 외관 관리 테스트 근거')
                """, INGREDIENT_ID);
        addProduct("product-filter-http-match", "토너", "가 필터 일치 제품");
        addProduct("product-filter-http-other-category", "세럼", "나 다른 종류 제품");
        addProduct("product-filter-http-inactive-review", "토너", "다 비활성 리뷰 제품");
        addProduct("product-filter-http-no-review", "토너", "라 리뷰 없는 제품");

        addReview("product-filter-http-match", "ACTIVE", 80);
        addReview("product-filter-http-match", "ACTIVE", 100);
        addReview("product-filter-http-other-category", "ACTIVE", 95);
        addReview("product-filter-http-inactive-review", "SUSPENDED", 100);
    }

    @Test
    void combinesRealIngredientActiveReviewAndPersonalizedScoreFiltersBeforePagination() throws Exception {
        HttpResponse<String> response = get("/api/v1/products?ingredientId=" + INGREDIENT_ID
                + "&category=토너&minReviewScore=90&minFirepowerScore=70&page=0&size=1");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body())
                .contains("product-filter-http-match", "\"reviewScore\":90.0", "\"reviewCount\":2",
                        "\"totalElements\":1", "\"totalPages\":1")
                .doesNotContain("product-filter-http-other-category", "product-filter-http-inactive-review",
                        "product-filter-http-no-review");

        HttpResponse<String> aboveMaximumFirepower = get("/api/v1/products?ingredientId=" + INGREDIENT_ID
                + "&minFirepowerScore=100");
        assertThat(aboveMaximumFirepower.statusCode()).isEqualTo(200);
        assertThat(aboveMaximumFirepower.body()).contains("\"content\":[]", "\"totalElements\":0");
    }

    @Test
    void includesReviewMetricsWithoutAReviewFilterAndIgnoresInactiveAuthors() throws Exception {
        HttpResponse<String> reviewed = get("/api/v1/products?query="
                + java.net.URLEncoder.encode("가 필터 일치", java.nio.charset.StandardCharsets.UTF_8));

        assertThat(reviewed.statusCode()).isEqualTo(200);
        assertThat(reviewed.body()).contains("\"reviewScore\":90.0", "\"reviewCount\":2");

        HttpResponse<String> inactiveOnly = get("/api/v1/products?query="
                + java.net.URLEncoder.encode("다 비활성 리뷰", java.nio.charset.StandardCharsets.UTF_8));

        assertThat(inactiveOnly.statusCode()).isEqualTo(200);
        assertThat(inactiveOnly.body()).contains("\"reviewScore\":null", "\"reviewCount\":0");
    }

    @Test
    void rejectsOutOfRangeScoresAndOversizedIngredientId() throws Exception {
        assertThat(get("/api/v1/products?minReviewScore=-1").statusCode()).isEqualTo(400);
        assertThat(get("/api/v1/products?minFirepowerScore=101").statusCode()).isEqualTo(400);
        assertThat(get("/api/v1/products?ingredientId=" + "x".repeat(65)).statusCode()).isEqualTo(400);
    }

    @Test
    void treatsConcernWordsAsConcernSearchAndKeepsTheRemainingTextFilter() throws Exception {
        HttpResponse<String> response = get("/api/v1/products?query="
                + java.net.URLEncoder.encode("주름 필터", java.nio.charset.StandardCharsets.UTF_8)
                + "&page=0&size=50");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body())
                .contains("product-filter-http-match", "product-filter-http-other-category",
                        "product-filter-http-inactive-review", "product-filter-http-no-review",
                        "탄력·잔주름 고민과 연결돼요")
                .contains("\"totalElements\":4");
    }

    @Test
    void treatsAProductTypeAfterAConcernAsAnExactCategory() throws Exception {
        HttpResponse<String> response = get("/api/v1/products?query="
                + java.net.URLEncoder.encode("주름 토너", java.nio.charset.StandardCharsets.UTF_8)
                + "&page=0&size=50");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body())
                .contains("product-filter-http-match", "product-filter-http-inactive-review",
                        "product-filter-http-no-review")
                .doesNotContain("product-filter-http-other-category");
    }

    private void addProduct(String id, String category, String name) {
        jdbc.update("""
                INSERT INTO products
                    (id, brand, name, category, base_score, benefit, sub_benefit, price, tone, publication_status)
                VALUES (?, '필터 테스트', ?, ?, 90, '진정', '보습', 10000, 'rose', 'PUBLISHED')
                """, id, name, category);
        jdbc.update("""
                INSERT INTO product_ingredients (product_id, ingredient_id, display_order)
                VALUES (?, ?, 1)
                """, id, INGREDIENT_ID);
    }

    private void addReview(String productId, String userStatus, int score) {
        String userId = UUID.randomUUID().toString();
        String email = productId + "-" + userStatus.toLowerCase() + "-" + userId.substring(0, 8) + "@example.com";
        String nickname = "필터" + score + " " + userId.substring(0, 8);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status)
                VALUES (?, ?, 'unused-test-password', ?, ?, 'USER', ?)
                """, userId, email, nickname, ActivityNickname.key(ActivityNickname.normalize(nickname)), userStatus);
        jdbc.update("""
                INSERT INTO reviews
                    (id, product_id, user_id, template_id, total_score, content, skin_type, usage_period, repurchase_yn)
                VALUES (?, ?, ?, 'review-generic-v1', ?, '필터 API 통합 테스트 리뷰입니다.', '중성', 'ONE_MONTH', TRUE)
                """, UUID.randomUUID().toString(), productId, userId, score);
    }

    private HttpResponse<String> get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .GET()
                .build();
        return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    }
}
