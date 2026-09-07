package com.hwaryeok.review;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import com.hwaryeok.auth.InvalidCredentialsException;
import com.hwaryeok.common.error.ForbiddenOperationException;
import com.hwaryeok.common.error.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:review-reputation;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@Transactional
class ReviewReputationServiceTest {

    @Autowired private ReviewReputationService service;
    @Autowired private ReviewService reviewService;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private EntityManager entityManager;

    private String author;
    private String otherAuthor;
    private String unratedAuthor;
    private String voter;
    private String otherVoter;
    private String product;
    private String otherProduct;
    private String hiddenProduct;
    private String review;
    private String otherReview;
    private String hiddenReview;

    @BeforeEach
    void setUp() {
        author = addUser("가 리뷰어", "ACTIVE", "건성");
        otherAuthor = addUser("나 리뷰어", "ACTIVE", "지성");
        unratedAuthor = addUser("다 리뷰어", "ACTIVE", null);
        voter = addUser("첫 평가자", "ACTIVE", null);
        otherVoter = addUser("둘째 평가자", "ACTIVE", null);
        product = addProduct("PUBLISHED");
        otherProduct = addProduct("PUBLISHED");
        hiddenProduct = addProduct("HIDDEN");
        review = addReview(author, product, 40);
        otherReview = addReview(author, otherProduct, 80);
        hiddenReview = addReview(author, hiddenProduct, 100);
        addReview(unratedAuthor, product, 90);
    }

    @Test
    void repeatPutUpdatesOneRatingWithoutChangingProductReviewScores() {
        service.rate(review, voter, 2);
        var updated = service.rate(review, voter, 5);
        assertThat(updated.ratingCount()).isEqualTo(1);
        assertThat(updated.averageScore()).isEqualByComparingTo("5.0");
        assertThat(updated.viewerScore()).isEqualTo(5);
        assertThat(updated.canRate()).isTrue();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM review_firepower_ratings WHERE review_id = ?", Integer.class, review))
                .isEqualTo(1);
        assertThat(reviewService.metrics(product).averageScore()).isEqualByComparingTo("65.0");
        assertThat(jdbc.queryForObject("SELECT total_score FROM reviews WHERE id = ?", Integer.class, review)).isEqualTo(40);
    }

    @Test
    void deleteOnlyRemovesTheCallersRatingAndIsIdempotent() {
        service.rate(review, voter, 5);
        service.rate(review, otherVoter, 3);
        var response = service.remove(review, voter);
        assertThat(response.ratingCount()).isEqualTo(1);
        assertThat(response.averageScore()).isEqualByComparingTo("3.0");
        assertThat(response.viewerScore()).isNull();
        assertThat(service.remove(review, voter).ratingCount()).isEqualTo(1);
        var empty = service.remove(review, otherVoter);
        assertThat(empty.ratingCount()).isZero();
        assertThat(empty.averageScore()).isNull();
        assertThat(service.profile(author).reviewFirepower()).isNull();
        assertThat(service.profile(author).rank()).isNull();
    }

    @Test
    void rejectsSelfRatingInvalidScoresAndUnknownVoters() {
        assertThatThrownBy(() -> service.rate(review, author, 5)).isInstanceOf(ForbiddenOperationException.class);
        assertThatThrownBy(() -> service.remove(review, author)).isInstanceOf(ForbiddenOperationException.class);
        assertThatThrownBy(() -> service.rate(review, voter, null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.rate(review, voter, 0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.rate(review, voter, 6)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.rate(review, "missing-user", 5)).isInstanceOf(InvalidCredentialsException.class);
        assertThat(service.summary(review, author).canRate()).isFalse();
        assertThat(service.summary(review, null).canRate()).isFalse();
        assertThat(service.summary(review, voter).canRate()).isTrue();
    }

    @Test
    void neverExposesHiddenProductsOrTheirReviewsAndRatings() {
        assertThatThrownBy(() -> service.rate(hiddenReview, voter, 5)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.summary(hiddenReview, null)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.remove(hiddenReview, voter)).isInstanceOf(ResourceNotFoundException.class);
        var publicReviews = reviewService.reviewsByUser(author, 0, 12, voter);
        assertThat(publicReviews.reviewCount()).isEqualTo(2);
        assertThat(publicReviews.averageReviewScore()).isEqualByComparingTo("60.0");
        assertThat(publicReviews.content()).extracting(ReviewerReviewResponse::id).containsExactlyInAnyOrder(review, otherReview);
        assertThat(service.profile(author).reviewCount()).isEqualTo(2);
        assertThat(service.profile(author).averageReviewScore()).isEqualByComparingTo("60.0");
        service.rate(review, voter, 5);
        jdbc.update("UPDATE products SET publication_status = 'HIDDEN' WHERE id = ?", product);
        assertThat(service.profile(author).reviewFirepower()).isNull();
        assertThat(service.profile(author).reviewCount()).isEqualTo(1);
        assertThat(service.ranking(null, 0, 50).content()).noneMatch(profile -> profile.userId().equals(unratedAuthor));
    }

    @Test
    void suspendedAndWithdrawnVotersLoseInfluenceImmediately() {
        service.rate(review, voter, 5);
        service.rate(review, otherVoter, 1);
        jdbc.update("UPDATE users SET status = 'SUSPENDED' WHERE id = ?", voter);
        entityManager.clear();
        var summary = service.summary(review, voter);
        assertThat(summary.ratingCount()).isEqualTo(1);
        assertThat(summary.averageScore()).isEqualByComparingTo("1.0");
        assertThat(summary.viewerScore()).isNull();
        assertThat(summary.canRate()).isFalse();
        assertThat(service.profile(author).uniqueRaterCount()).isEqualTo(1);
        assertThat(service.profile(author).reviewFirepower()).isEqualByComparingTo("45.0");
        assertThatThrownBy(() -> service.rate(review, voter, 4)).isInstanceOf(InvalidCredentialsException.class);
        jdbc.update("UPDATE users SET status = 'WITHDRAWN' WHERE id = ?", otherVoter);
        entityManager.clear();
        assertThat(service.summary(review, null).ratingCount()).isZero();
        assertThat(service.profile(author).reviewFirepower()).isNull();
        assertThatThrownBy(() -> service.remove(review, otherVoter)).isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void inactiveAuthorsAreRemovedFromProfilesRankingAndPublicProductReviews() {
        service.rate(review, voter, 5);
        jdbc.update("UPDATE users SET status = 'WITHDRAWN' WHERE id = ?", author);
        entityManager.clear();
        assertThatThrownBy(() -> service.profile(author)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> reviewService.reviewsByUser(author, 0, 12)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.rate(review, voter, 3)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.summary(review, voter)).isInstanceOf(ResourceNotFoundException.class);
        assertThat(service.ranking(null, 0, 50).content()).noneMatch(profile -> profile.userId().equals(author));
        var summary = reviewService.summary(product, voter);
        assertThat(summary.reviewCount()).isEqualTo(1);
        assertThat(summary.reviewScore()).isEqualByComparingTo("90.0");
        assertThat(summary.reviews()).noneMatch(item -> item.authorId().equals(author));
    }

    @Test
    void averagesEachEvaluatorsOpinionsOnceAndShowsCurrentPublicSkinType() {
        String competitorReview = addReview(otherAuthor, product, 75);
        service.rate(review, voter, 5);
        service.rate(otherReview, voter, 5);
        service.rate(review, otherVoter, 1);
        service.rate(competitorReview, voter, 4);
        var profile = service.profile(author);
        assertThat(profile.averageReceivedRating()).isEqualByComparingTo("3.0");
        assertThat(profile.reviewFirepower()).isEqualByComparingTo("52.9");
        assertThat(profile.receivedRatingCount()).isEqualTo(3);
        assertThat(profile.uniqueRaterCount()).isEqualTo(2);
        assertThat(profile.skinType()).isEqualTo("건성"); // Review metadata is deliberately 지성.
        assertThat(profile.rank()).isEqualTo(2);
        assertThat(service.profile(otherAuthor).reviewFirepower()).isEqualByComparingTo("55.0");
        var ranking = service.ranking(null, 0, 50);
        assertThat(ranking.content()).extracting(ReviewerProfileResponse::userId)
                .containsExactly(otherAuthor, author, unratedAuthor);
        assertThat(ranking.content().getLast().rank()).isNull();
        assertThat(ranking.content().getLast().reviewFirepower()).isNull();
        assertThat(ranking.content().getLast().skinType()).isNull();
    }

    @Test
    void appliesSkinFilterBeforePaginationAndHandlesInvalidOrOverflowInputs() {
        addReview(otherAuthor, product, 75);
        service.rate(review, voter, 5);
        var first = service.ranking(null, 0, 1);
        var second = service.ranking(null, 1, 1);
        assertThat(first.totalElements()).isEqualTo(3);
        assertThat(first.totalPages()).isEqualTo(3);
        assertThat(first.hasNext()).isTrue();
        assertThat(first.content().getFirst().userId()).isEqualTo(author);
        assertThat(second.content().getFirst().userId()).isEqualTo(otherAuthor);
        var dry = service.ranking("건성", 0, 1);
        assertThat(dry.totalElements()).isEqualTo(1);
        assertThat(dry.hasNext()).isFalse();
        assertThat(dry.skinType()).isEqualTo("건성");
        assertThat(dry.content().getFirst().rank()).isEqualTo(1);
        assertThat(service.ranking("민감성", 0, 20).skinType()).isEqualTo("민감");
        assertThat(service.ranking("민감", 0, 20).content()).isEmpty();
        assertThat(service.ranking(null, Integer.MAX_VALUE, 50).content()).isEmpty();
        assertThatThrownBy(() -> service.ranking(null, -1, 20)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.ranking(null, 0, 0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.ranking(null, 0, 51)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.ranking("아무거나", 0, 20)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void reviewListsIncludeViewerSpecificCommunityRatingsWithoutLeakingOtherVoters() {
        service.rate(review, voter, 4);
        var productSummary = reviewService.summary(product, voter);
        assertThat(productSummary.reviews()).filteredOn(item -> item.id().equals(review)).singleElement()
                .satisfies(item -> {
                    assertThat(item.communityRating().viewerScore()).isEqualTo(4);
                    assertThat(item.communityRating().ratingCount()).isEqualTo(1);
                });
        var authorReviews = reviewService.reviewsByUser(author, 0, 12, otherVoter);
        assertThat(authorReviews.content()).filteredOn(item -> item.id().equals(review)).singleElement()
                .satisfies(item -> {
                    assertThat(item.communityRating().viewerScore()).isNull();
                    assertThat(item.communityRating().averageScore()).isEqualByComparingTo("4.0");
                    assertThat(item.communityRating().canRate()).isTrue();
                });
        assertThat(reviewService.reviewsByUser(author, 0, 12, author).content())
                .allMatch(item -> !item.communityRating().canRate());
    }

    @Test
    void unratedActiveProfilesHaveNoFabricatedTemperatureOrRank() {
        var profile = service.profile(voter);
        assertThat(profile.reviewCount()).isZero();
        assertThat(profile.reviewFirepower()).isNull();
        assertThat(profile.averageReceivedRating()).isNull();
        assertThat(profile.averageReviewScore()).isNull();
        assertThat(profile.rank()).isNull();
        assertThat(service.ranking(null, 0, 50).content()).noneMatch(item -> item.userId().equals(voter));
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void concurrentFirstPutsStillCreateOnlyOneRating() throws Exception {
        try (var executor = Executors.newFixedThreadPool(2)) {
            var barrier = new CyclicBarrier(2);
            var first = executor.submit(() -> { barrier.await(); return service.rate(review, voter, 3); });
            var second = executor.submit(() -> { barrier.await(); return service.rate(review, voter, 5); });
            first.get(20, TimeUnit.SECONDS);
            second.get(20, TimeUnit.SECONDS);
            var summary = service.summary(review, voter);
            assertThat(summary.ratingCount()).isEqualTo(1);
            assertThat(summary.viewerScore()).isIn(3, 5);
            assertThat(service.profile(author).uniqueRaterCount()).isEqualTo(1);
        } finally {
            for (String id : List.of(author, otherAuthor, unratedAuthor, voter, otherVoter)) {
                jdbc.update("DELETE FROM users WHERE id = ?", id);
            }
            for (String id : List.of(product, otherProduct, hiddenProduct)) jdbc.update("DELETE FROM products WHERE id = ?", id);
        }
    }

    private String addUser(String nickname, String status, String skinType) {
        String id = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, role, status)
                VALUES (?, ?, 'test-unused', ?, 'USER', ?)
                """, id, id + "@example.com", nickname, status);
        if (skinType != null) jdbc.update("INSERT INTO user_skin_profiles (user_id, skin_type) VALUES (?, ?)", id, skinType);
        return id;
    }

    private String addProduct(String status) {
        String id = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO products (id, brand, name, category, base_score, benefit, sub_benefit, price, tone, publication_status)
                VALUES (?, '화력 테스트', '리뷰 테스트 크림', '크림', 90, '보습', '보습', 10000, 'rose', ?)
                """, id, status);
        return id;
    }

    private String addReview(String userId, String productId, int score) {
        String id = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO reviews (id, product_id, user_id, template_id, total_score, content, skin_type, usage_period, repurchase_yn)
                VALUES (?, ?, ?, 'review-moisturizer-v1', ?, '직접 작성한 테스트 리뷰입니다.', '지성', 'ONE_MONTH', TRUE)
                """, id, productId, userId, score);
        return id;
    }
}
