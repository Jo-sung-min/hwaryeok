package com.hwaryeok.ranking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import com.hwaryeok.product.ProductRepository;
import com.hwaryeok.product.ProductService;
import com.hwaryeok.ranking.RisingRankingDtos.CategoryOption;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:rising-ranking;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@Transactional
class RisingRankingServiceTest {

    private static final Instant NOW = Instant.parse("2026-09-07T03:00:00Z");
    private static final Instant RECENT_START = NOW.minus(7, ChronoUnit.DAYS);
    private static final Instant PREVIOUS_START = NOW.minus(14, ChronoUnit.DAYS);

    @Autowired private JdbcTemplate jdbc;
    @Autowired private ProductRepository products;
    @Autowired private ProductService productService;
    private RisingRankingService service;

    @BeforeEach
    void setUp() {
        service = new RisingRankingService(jdbc, products, productService, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void emptyRankingHasNoInventedTrendOrProductScores() {
        addProduct("rising-no-reviews", "크림", "PUBLISHED", 100);
        var response = service.rank(null, 0, 12);
        assertThat(response.content()).isEmpty();
        assertThat(response.categories()).isEmpty();
        assertThat(response.totalElements()).isZero();
        assertThat(response.totalPages()).isZero();
        assertThat(response.hasNext()).isFalse();
        assertThat(response.category()).isNull();
        assertThat(response.window().days()).isEqualTo(7);
        assertThat(response.window().asOf()).isEqualTo(NOW);
        assertThat(response.window().recentStart()).isEqualTo(RECENT_START);
        assertThat(response.window().previousStart()).isEqualTo(PREVIOUS_START);
        assertThat(response.scoreBasis()).contains("최근 7일", "직전 7일", "판매량·조회수·관리자 점수는 사용하지 않아요");
    }

    @Test
    void usesHalfOpenWindowsAndExcludesFutureReviews() {
        String product = addProduct("rising-boundaries", "앰플", "PUBLISHED", 1);
        addReview(product, "ACTIVE", 80, RECENT_START); // Recent includes its start.
        addReview(product, "ACTIVE", 100, NOW.minusSeconds(1));
        addReview(product, "ACTIVE", 60, PREVIOUS_START); // Previous includes its start.
        addReview(product, "ACTIVE", 5, PREVIOUS_START.minusSeconds(1)); // Lifetime only.
        addReview(product, "ACTIVE", 0, NOW); // As-of endpoint is excluded.
        addReview(product, "ACTIVE", 0, NOW.plus(1, ChronoUnit.DAYS));

        var item = service.rank(null, 0, 12).content().getFirst();
        assertThat(item.product().id()).isEqualTo(product);
        assertThat(item.reviewCount()).isEqualTo(4);
        assertThat(item.recentReviewCount()).isEqualTo(2);
        assertThat(item.previousReviewCount()).isEqualTo(1);
        assertThat(item.reviewGrowth()).isEqualTo(1);
        assertThat(item.recentReviewScore()).isEqualByComparingTo("90.0");
    }

    @Test
    void excludesFlatFallingAndOldProductsEvenWithHighAdminScores() {
        String flat = addProduct("rising-flat", "크림", "PUBLISHED", 100);
        String falling = addProduct("rising-falling", "크림", "PUBLISHED", 100);
        String old = addProduct("rising-old", "크림", "PUBLISHED", 100);
        String rising = addProduct("rising-positive", "크림", "PUBLISHED", 1);
        addReview(flat, "ACTIVE", 100, RECENT_START.plusSeconds(1));
        addReview(flat, "ACTIVE", 100, RECENT_START.minusSeconds(1));
        addReview(falling, "ACTIVE", 100, PREVIOUS_START.plusSeconds(1));
        addReview(old, "ACTIVE", 100, PREVIOUS_START.minusSeconds(1));
        addReview(rising, "ACTIVE", 20, NOW.minusSeconds(1));

        var response = service.rank(null, 0, 12);
        assertThat(response.content()).singleElement().satisfies(item -> {
            assertThat(item.product().id()).isEqualTo(rising);
            assertThat(item.rank()).isEqualTo(1);
            assertThat(item.reviewGrowth()).isEqualTo(1);
            assertThat(item.recentReviewScore()).isEqualByComparingTo("20.0");
        });
    }

    @Test
    void sortsGrowthThenRecentCountThenRecentAverageThenStableProductId() {
        String greatestGrowth = addProduct("rising-growth", "크림", "PUBLISHED", 1);
        String highVolume = addProduct("rising-volume", "크림", "PUBLISHED", 1);
        String highScore = addProduct("rising-score", "크림", "PUBLISHED", 1);
        String firstTie = addProduct("rising-tie-a", "크림", "PUBLISHED", 100);
        String secondTie = addProduct("rising-tie-b", "크림", "PUBLISHED", 100);
        recent(greatestGrowth, 3, 20);
        recent(highVolume, 3, 20);
        addReview(highVolume, "ACTIVE", 90, PREVIOUS_START);
        recent(highScore, 2, 90);
        recent(firstTie, 2, 80);
        recent(secondTie, 2, 80);

        var response = service.rank(null, 0, 12);
        assertThat(response.content()).extracting(item -> item.product().id())
                .containsExactly(greatestGrowth, highVolume, highScore, firstTie, secondTie);
        assertThat(response.content()).extracting(RisingRankingDtos.RankedProduct::rank)
                .containsExactly(1L, 2L, 3L, 4L, 5L);
    }

    @Test
    void hidesUnpublishedProductsAndInactiveAuthorsImmediately() {
        String published = addProduct("rising-public", "크림", "PUBLISHED", 100);
        String hidden = addProduct("rising-hidden", "크림", "HIDDEN", 100);
        String draft = addProduct("rising-draft", "크림", "DRAFT", 100);
        String noActiveReviews = addProduct("rising-inactive", "크림", "PUBLISHED", 100);
        String activeAuthor = addReview(published, "ACTIVE", 40, NOW.minusSeconds(1));
        addReview(published, "SUSPENDED", 100, NOW.minusSeconds(1));
        addReview(published, "WITHDRAWN", 100, PREVIOUS_START);
        addReview(hidden, "ACTIVE", 100, NOW.minusSeconds(1));
        addReview(draft, "ACTIVE", 100, NOW.minusSeconds(1));
        addReview(noActiveReviews, "WITHDRAWN", 100, NOW.minusSeconds(1));
        assertThat(service.rank(null, 0, 12).content()).singleElement().satisfies(item -> {
            assertThat(item.product().id()).isEqualTo(published);
            assertThat(item.reviewCount()).isEqualTo(1);
            assertThat(item.reviewGrowth()).isEqualTo(1);
            assertThat(item.recentReviewScore()).isEqualByComparingTo("40.0");
        });
        jdbc.update("UPDATE users SET status = 'SUSPENDED' WHERE id = ?", activeAuthor);
        assertThat(service.rank(null, 0, 12).content()).isEmpty();
    }

    @Test
    void filtersCategoriesBeforePaginationAndCountsOnlyQualifiedRisingProducts() {
        String ampouleA = addProduct("rising-ampoule-a", "앰플", "PUBLISHED", 1);
        String ampouleB = addProduct("rising-ampoule-b", "앰플", "PUBLISHED", 1);
        String toner = addProduct("rising-toner", "토너", "PUBLISHED", 1);
        String sunscreen = addProduct("rising-sunscreen", "선크림", "PUBLISHED", 1);
        String cleanser = addProduct("rising-cleanser", "클렌징폼", "PUBLISHED", 1);
        addProduct("rising-empty-ampoule", "앰플", "PUBLISHED", 100);
        recent(ampouleA, 2, 90);
        recent(ampouleB, 1, 90);
        recent(toner, 3, 90);
        recent(sunscreen, 1, 90);
        recent(cleanser, 1, 90);

        var first = service.rank(" 앰플 ", 0, 1);
        var second = service.rank("앰플", 1, 1);
        assertThat(first.category()).isEqualTo("앰플");
        assertThat(first.totalElements()).isEqualTo(2);
        assertThat(first.totalPages()).isEqualTo(2);
        assertThat(first.hasNext()).isTrue();
        assertThat(first.content()).singleElement().satisfies(item -> {
            assertThat(item.product().id()).isEqualTo(ampouleA);
            assertThat(item.rank()).isEqualTo(1);
        });
        assertThat(second.hasNext()).isFalse();
        assertThat(second.content()).singleElement().satisfies(item -> {
            assertThat(item.product().id()).isEqualTo(ampouleB);
            assertThat(item.rank()).isEqualTo(2);
        });
        assertThat(first.categories()).containsExactly(new CategoryOption("토너", 1),
                new CategoryOption("앰플", 2), new CategoryOption("선케어", 1), new CategoryOption("클렌저", 1));
        assertThat(service.rank("선케어", 0, 12).content().getFirst().product().id()).isEqualTo(sunscreen);
        assertThat(service.rank("선크림", 0, 12).category()).isEqualTo("선케어");
        assertThat(service.rank("클렌저", 0, 12).content().getFirst().product().id()).isEqualTo(cleanser);
        assertThat(service.rank("클렌징폼", 0, 12).category()).isEqualTo("클렌저");
        assertThat(service.rank("전체보기", 0, 12).totalElements()).isEqualTo(5);
    }

    @Test
    void handlesNoMatchesLargePagesAndRejectsInvalidPagination() {
        String product = addProduct("rising-validation", "크림", "PUBLISHED", 100);
        recent(product, 1, 90);
        assertThat(service.rank("없는 카테고리", 0, 12).content()).isEmpty();
        assertThat(service.rank("없는 카테고리", 0, 12).totalElements()).isZero();
        var overflow = service.rank(null, Integer.MAX_VALUE, 50);
        assertThat(overflow.content()).isEmpty();
        assertThat(overflow.totalElements()).isEqualTo(1);
        assertThat(overflow.hasNext()).isFalse();
        assertThatThrownBy(() -> service.rank(null, -1, 12)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.rank(null, 0, 0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.rank(null, 0, 51)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.rank("가".repeat(101), 0, 12)).isInstanceOf(IllegalArgumentException.class);
    }

    private String addProduct(String id, String category, String status, int baseScore) {
        jdbc.update("""
                INSERT INTO products (id, brand, name, category, base_score, benefit, sub_benefit, price, tone, publication_status)
                VALUES (?, '급상승 테스트', '직접 사용 리뷰 제품', ?, ?, '보습', '보습', 10000, 'rose', ?)
                """, id, category, baseScore, status);
        return id;
    }

    private void recent(String productId, int count, int score) {
        for (int index = 0; index < count; index++) addReview(productId, "ACTIVE", score, NOW.minusSeconds(1));
    }

    private String addReview(String productId, String status, int score, Instant createdAt) {
        String userId = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, role, status)
                VALUES (?, ?, 'test-unused', '급상승 테스트 사용자', 'USER', ?)
                """, userId, userId + "@example.com", status);
        jdbc.update("""
                INSERT INTO reviews (id, product_id, user_id, template_id, total_score, content, skin_type, usage_period, repurchase_yn, created_at)
                VALUES (?, ?, ?, 'review-moisturizer-v1', ?, '직접 작성한 테스트 리뷰입니다.', '건성', 'ONE_MONTH', TRUE, ?)
                """, UUID.randomUUID().toString(), productId, userId, score, Timestamp.from(createdAt));
        return userId;
    }
}
