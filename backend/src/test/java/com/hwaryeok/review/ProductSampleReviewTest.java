package com.hwaryeok.review;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.UUID;

import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.product.AdminProductRequest;
import com.hwaryeok.product.ProductPublicationStatus;
import com.hwaryeok.product.ProductService;
import com.hwaryeok.user.ActivityNickname;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties =
        "spring.datasource.url=jdbc:h2:mem:product-sample-reviews;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@Transactional
class ProductSampleReviewTest {

    @Autowired private JdbcTemplate jdbc;
    @Autowired private ReviewService reviewService;
    @Autowired private ReviewReputationService reputationService;
    @Autowired private ProductService productService;
    @Autowired private EntityManager entityManager;

    @Test
    void seedsOneSeparateSampleForEveryExistingProductWithoutChangingAggregates() {
        long products = jdbc.queryForObject("SELECT COUNT(*) FROM products", Long.class);
        long samples = jdbc.queryForObject("SELECT COUNT(*) FROM product_sample_reviews", Long.class);

        assertThat(samples).isEqualTo(products);
        ProductReviewSummaryResponse summary = reviewService.summary("heartleaf-toner", null);
        assertThat(summary.reviewCount()).isZero();
        assertThat(summary.reviewScore()).isNull();
        assertThat(summary.rankingStatus()).isEqualTo("COLLECTING");
        assertThat(summary.reviews()).singleElement().satisfies(review -> {
            assertThat(review.id()).isEqualTo("sample:heartleaf-toner");
            assertThat(review.authorId()).isNull();
            assertThat(review.authorNickname()).isEqualTo("화력 샘플");
            assertThat(review.sampleReview()).isTrue();
            assertThat(review.communityRating().canRate()).isFalse();
            assertThat(review.communityRating().ratingCount()).isZero();
        });
        assertThatThrownBy(() -> reputationService.summary("sample:heartleaf-toner", null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void aRealReviewReplacesTheSampleInPublicResultsButDoesNotDeleteIt() {
        String userId = UUID.randomUUID().toString();
        String nickname = "실사용 리뷰어";
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status)
                VALUES (?, ?, NULL, ?, ?, 'USER', 'ACTIVE')
                """, userId, userId + "@example.com", nickname,
                ActivityNickname.key(ActivityNickname.normalize(nickname)));
        jdbc.update("""
                INSERT INTO reviews
                    (id, product_id, user_id, template_id, total_score, content, skin_type, usage_period, repurchase_yn)
                VALUES (?, 'heartleaf-toner', ?, 'review-toner-v1', 90, '한 달 동안 사용한 실제 사용자 리뷰 내용입니다.',
                        '민감', 'ONE_MONTH', TRUE)
                """, UUID.randomUUID().toString(), userId);

        ProductReviewSummaryResponse summary = reviewService.summary("heartleaf-toner", null);

        assertThat(summary.reviewCount()).isEqualTo(1);
        assertThat(summary.reviewScore()).isEqualByComparingTo("90.0");
        assertThat(summary.reviews()).singleElement().satisfies(review -> {
            assertThat(review.authorId()).isEqualTo(userId);
            assertThat(review.sampleReview()).isFalse();
        });
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM product_sample_reviews WHERE product_id = 'heartleaf-toner'", Long.class
        )).isEqualTo(1);
    }

    @Test
    void creatingAnAdminProductCreatesItsSampleExactlyOnce() {
        String productId = "new-sample-" + UUID.randomUUID().toString().substring(0, 8);
        AdminProductRequest request = new AdminProductRequest(
                productId, "테스트 브랜드", "테스트 수분 크림", "크림", 80,
                "보습", "진정", 20000, "rose", null,
                ProductPublicationStatus.PUBLISHED, "https://example.com/product", LocalDate.of(2026, 9, 11)
        );

        productService.createProduct(request);
        entityManager.flush();

        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM product_sample_reviews WHERE product_id = ?", Long.class, productId
        )).isEqualTo(1);
        assertThat(reviewService.summary(productId, null).reviews())
                .singleElement()
                .extracting(ReviewDetailResponse::sampleReview)
                .isEqualTo(true);
    }
}
