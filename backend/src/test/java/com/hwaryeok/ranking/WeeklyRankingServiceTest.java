package com.hwaryeok.ranking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.product.ProductRepository;
import com.hwaryeok.product.ProductService;
import com.hwaryeok.ranking.WeeklyRankingDtos.Mode;
import com.hwaryeok.ranking.WeeklyRankingDtos.UpdateRequest;
import com.hwaryeok.user.ActivityNickname;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:weekly-ranking;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@Transactional
class WeeklyRankingServiceTest {

    private static final Instant MONDAY_IN_SEOUL = Instant.parse("2026-09-06T15:00:00Z");

    @Autowired private JdbcTemplate jdbc;
    @Autowired private ProductRepository products;
    @Autowired private ProductService productService;
    private WeeklyRankingService service;

    @BeforeEach
    void setUp() {
        service = serviceAt(MONDAY_IN_SEOUL);
    }

    @Test
    void fixesTheWeekAtMondayMidnightInSeoulAndExcludesThisWeeksReviews() {
        String before = addProduct("weekly-before", "PUBLISHED", "https://example.com/before.jpg");
        String boundary = addProduct("aaa-weekly-boundary", "PUBLISHED", "https://example.com/boundary.jpg");
        addReview(before, "ACTIVE", 80, MONDAY_IN_SEOUL.minusSeconds(1));
        addReview(boundary, "ACTIVE", 100, MONDAY_IN_SEOUL);

        var response = service.current();

        assertThat(response.weekStart()).hasToString("2026-09-07");
        assertThat(response.nextRefreshOn()).hasToString("2026-09-14");
        assertThat(response.mode()).isEqualTo(Mode.AUTO);
        assertThat(response.scoreBasis()).contains(
                "평가 개수 내림차순", "평균 평가점수 내림차순", "제품 ID 오름차순"
        );
        assertThat(response.content().getFirst().product().id()).isEqualTo(before);
        assertThat(response.content().getFirst().reviewCount()).isEqualTo(1);
        assertThat(response.content()).filteredOn(item -> item.product().id().equals(boundary))
                .singleElement().satisfies(item -> {
                    assertThat(item.reviewCount()).isZero();
                    assertThat(item.reviewScore()).isNull();
                });
    }

    @Test
    void sortsByReviewCountThenAverageScoreThenProductIdAndFillsWithZeroReviewProducts() {
        String mostReviews = addProduct("weekly-count", "PUBLISHED", "https://example.com/count.jpg");
        String highScore = addProduct("weekly-score", "PUBLISHED", "https://example.com/score.jpg");
        String tieA = addProduct("weekly-tie-a", "PUBLISHED", "https://example.com/tie-a.jpg");
        String tieB = addProduct("weekly-tie-b", "PUBLISHED", "https://example.com/tie-b.jpg");
        String zero = addProduct("aaa-weekly-zero", "PUBLISHED", "https://example.com/zero.jpg");
        addReview(mostReviews, "ACTIVE", 20, MONDAY_IN_SEOUL.minusSeconds(10));
        addReview(mostReviews, "ACTIVE", 20, MONDAY_IN_SEOUL.minusSeconds(9));
        addReview(highScore, "ACTIVE", 95, MONDAY_IN_SEOUL.minusSeconds(8));
        addReview(tieB, "ACTIVE", 70, MONDAY_IN_SEOUL.minusSeconds(7));
        addReview(tieA, "ACTIVE", 70, MONDAY_IN_SEOUL.minusSeconds(6));

        var response = service.current();

        assertThat(response.content()).hasSize(10);
        assertThat(response.content()).extracting(item -> item.product().id()).startsWith(
                mostReviews, highScore, tieA, tieB, zero
        );
        assertThat(response.content()).extracting(WeeklyRankingDtos.RankedProduct::rank)
                .containsExactly(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L);
        assertThat(response.content().get(0).reviewScore()).isEqualByComparingTo("20.0");
        assertThat(response.content().get(1).reviewScore()).isEqualByComparingTo("95.0");
    }

    @Test
    void onlyCountsActiveAuthorsAndOnlyOffersPublishedProductsWithImages() {
        String visible = addProduct("weekly-visible", "PUBLISHED", "https://example.com/visible.jpg");
        String hidden = addProduct("weekly-hidden", "HIDDEN", "https://example.com/hidden.jpg");
        String noImage = addProduct("weekly-no-image", "PUBLISHED", null);
        addReview(visible, "ACTIVE", 60, MONDAY_IN_SEOUL.minusSeconds(3));
        addReview(visible, "SUSPENDED", 100, MONDAY_IN_SEOUL.minusSeconds(2));
        addReview(hidden, "ACTIVE", 100, MONDAY_IN_SEOUL.minusSeconds(2));
        addReview(noImage, "ACTIVE", 100, MONDAY_IN_SEOUL.minusSeconds(2));

        var response = service.current();

        assertThat(response.content().getFirst().product().id()).isEqualTo(visible);
        assertThat(response.content().getFirst().reviewCount()).isEqualTo(1);
        assertThat(response.content()).extracting(item -> item.product().id())
                .doesNotContain(hidden, noImage);
    }

    @Test
    void adminCanReplaceThisWeeksOrderAndResetToAutomaticRanking() {
        String automaticFirst = addProduct("weekly-auto-first", "PUBLISHED", "https://example.com/auto.jpg");
        String manualFirst = addProduct("weekly-manual-first", "PUBLISHED", "https://example.com/manual.jpg");
        addReview(automaticFirst, "ACTIVE", 80, MONDAY_IN_SEOUL.minusSeconds(3));
        addReview(automaticFirst, "ACTIVE", 80, MONDAY_IN_SEOUL.minusSeconds(2));
        addReview(manualFirst, "ACTIVE", 90, MONDAY_IN_SEOUL.minusSeconds(1));

        var replaced = service.replace(new UpdateRequest(List.of(manualFirst, automaticFirst)));

        assertThat(replaced.mode()).isEqualTo(Mode.MANUAL);
        assertThat(replaced.content()).extracting(item -> item.product().id())
                .containsExactly(manualFirst, automaticFirst);
        assertThat(service.current().content()).extracting(item -> item.product().id())
                .containsExactly(manualFirst, automaticFirst);

        var reset = service.reset();
        assertThat(reset.mode()).isEqualTo(Mode.AUTO);
        assertThat(reset.content().getFirst().product().id()).isEqualTo(automaticFirst);
    }

    @Test
    void overridesAreScopedToOneWeekAndRejectDuplicateOrIneligibleProducts() {
        String first = addProduct("weekly-admin-a", "PUBLISHED", "https://example.com/a.jpg");
        String second = addProduct("weekly-admin-b", "PUBLISHED", "https://example.com/b.jpg");
        String hidden = addProduct("weekly-admin-hidden", "HIDDEN", "https://example.com/hidden.jpg");
        String noImage = addProduct("weekly-admin-no-image", "PUBLISHED", null);
        service.replace(new UpdateRequest(List.of(second, first)));

        assertThat(serviceAt(MONDAY_IN_SEOUL.plusSeconds(7 * 24 * 60 * 60L)).current().mode())
                .isEqualTo(Mode.AUTO);
        assertThatThrownBy(() -> service.replace(new UpdateRequest(List.of(first, first))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("한 번만");
        assertThatThrownBy(() -> service.replace(new UpdateRequest(List.of())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("1개 이상 10개 이하");
        assertThatThrownBy(() -> service.replace(new UpdateRequest(
                IntStream.rangeClosed(1, 11).mapToObj(index -> "weekly-too-many-" + index).toList()
        )))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("1개 이상 10개 이하");
        assertThatThrownBy(() -> service.replace(new UpdateRequest(List.of(hidden))))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.replace(new UpdateRequest(List.of(noImage))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이미지가 등록된 공개 제품");
    }

    private WeeklyRankingService serviceAt(Instant instant) {
        return new WeeklyRankingService(jdbc, products, productService, Clock.fixed(instant, ZoneOffset.UTC));
    }

    private String addProduct(String id, String status, String imageUrl) {
        jdbc.update("""
                INSERT INTO products (
                    id, brand, name, category, base_score, benefit, sub_benefit, price, tone,
                    image_url, publication_status
                ) VALUES (?, '주간 랭킹 테스트', '평가 제품', '크림', 50, '보습', '진정', 10000, 'rose', ?, ?)
                """, id, imageUrl, status);
        return id;
    }

    private void addReview(String productId, String status, int score, Instant createdAt) {
        String userId = UUID.randomUUID().toString();
        String nickname = "주간 랭킹 사용자 " + userId.substring(0, 8);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status)
                VALUES (?, ?, 'test-unused', ?, ?, 'USER', ?)
                """, userId, userId + "@example.com", nickname,
                ActivityNickname.key(ActivityNickname.normalize(nickname)), status);
        jdbc.update("""
                INSERT INTO reviews (
                    id, product_id, user_id, template_id, total_score, content, skin_type,
                    usage_period, repurchase_yn, created_at
                ) VALUES (?, ?, ?, 'review-moisturizer-v1', ?, '주간 랭킹 테스트 리뷰입니다.', '건성',
                          'ONE_MONTH', TRUE, ?)
                """, UUID.randomUUID().toString(), productId, userId, score, Timestamp.from(createdAt));
    }
}
