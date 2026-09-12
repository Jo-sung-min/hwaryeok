package com.hwaryeok.ingredient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.user.ActivityNickname;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class IngredientRankingServiceTest {

    private static final String INGREDIENT_ID = "ranking-test-ingredient";

    @Autowired private IngredientRankingService service;
    @Autowired private IngredientFirepowerService firepowerService;
    @Autowired private JdbcTemplate jdbc;

    @BeforeEach
    void setUp() {
        jdbc.update("""
                INSERT INTO ingredients (id, name, english_name, role, description, status, evidence_level, featured, display_order)
                VALUES (?, '랭킹 테스트 성분', 'Ranking test ingredient', '보습', '테스트', 'GOOD', 'A', TRUE, 1)
                """, INGREDIENT_ID);
        addProduct("ranking-toner", "가 토너", "토너", "PUBLISHED", 1);
        addProduct("ranking-ampoule-a", "나 앰플", "앰플", "PUBLISHED", 8);
        addProduct("ranking-ampoule-b", "다 앰플", "앰플", "PUBLISHED", 10);
        addProduct("ranking-serum", "라 세럼", "세럼", "PUBLISHED", 2);
        addProduct("ranking-draft", "마 비공개 앰플", "앰플", "DRAFT", 1);
        addProduct("ranking-hidden", "바 숨긴 앰플", "앰플", "HIDDEN", 1);
    }

    @Test
    void filtersCategoryBeforePaginationAndReturnsCountsBeforeCategoryFiltering() {
        var first = service.rank(INGREDIENT_ID, "앰플", "FIREPOWER", 0, 1);
        var second = service.rank(INGREDIENT_ID, "앰플", "FIREPOWER", 1, 1);

        assertThat(first.totalElements()).isEqualTo(2);
        assertThat(first.totalPages()).isEqualTo(2);
        assertThat(first.hasNext()).isTrue();
        assertThat(first.content()).singleElement().satisfies(item -> {
            assertThat(item.product().id()).isEqualTo("ranking-ampoule-a");
            assertThat(item.rank()).isEqualTo(1);
        });
        assertThat(second.content()).singleElement().satisfies(item -> {
            assertThat(item.product().id()).isEqualTo("ranking-ampoule-b");
            assertThat(item.rank()).isEqualTo(2);
        });
        assertThat(first.categories()).extracting(IngredientRankingDtos.CategoryOption::name)
                .containsExactly("토너", "앰플", "세럼");
        assertThat(first.categories()).filteredOn(category -> category.name().equals("앰플"))
                .singleElement().extracting(IngredientRankingDtos.CategoryOption::productCount).isEqualTo(2L);
    }

    @Test
    void listsDynamicIngredientsAndNeverCountsOrRanksUnpublishedProducts() {
        assertThat(service.options().ingredients()).filteredOn(item -> item.id().equals(INGREDIENT_ID))
                .singleElement().extracting(IngredientRankingDtos.IngredientOption::productCount).isEqualTo(4L);
        assertThat(service.rank(null, null, "FIREPOWER", 0, 50).content())
                .noneMatch(item -> item.product().id().equals("ranking-draft") || item.product().id().equals("ranking-hidden"));
        assertThat(firepowerService.rankProducts(INGREDIENT_ID, 50).products())
                .hasSize(4).noneMatch(item -> item.product().id().equals("ranking-draft"));
    }

    @Test
    void ranksOnlyActiveUserReviewAveragesAndLeavesUnreviewedProductsUnranked() {
        addReview("ranking-ampoule-a", "ACTIVE", 82);
        addReview("ranking-ampoule-a", "ACTIVE", 89);
        addReview("ranking-ampoule-a", "SUSPENDED", 100);
        addReview("ranking-ampoule-b", "WITHDRAWN", 100);

        var response = service.rank(INGREDIENT_ID, "앰플", "REVIEW", 0, 12);
        assertThat(response.content()).hasSize(2);
        assertThat(response.content().getFirst().product().id()).isEqualTo("ranking-ampoule-a");
        assertThat(response.content().getFirst().reviewScore()).isEqualByComparingTo("85.5");
        assertThat(response.content().getFirst().reviewCount()).isEqualTo(2);
        assertThat(response.content().getFirst().rank()).isEqualTo(1);
        assertThat(response.content().getLast().reviewScore()).isNull();
        assertThat(response.content().getLast().reviewCount()).isZero();
        assertThat(response.content().getLast().rank()).isNull();
    }

    @Test
    void returnsHonestEmptyResultsAndValidatesInputs() {
        var empty = service.rank(INGREDIENT_ID, "없는 종류", "REVIEW", 0, 12);
        assertThat(empty.content()).isEmpty();
        assertThat(empty.totalElements()).isZero();
        assertThat(empty.totalPages()).isZero();
        assertThat(empty.hasNext()).isFalse();
        assertThat(service.rank(INGREDIENT_ID, null, "FIREPOWER", Integer.MAX_VALUE, 50).content()).isEmpty();
        assertThatThrownBy(() -> service.rank("missing-ingredient", null, "FIREPOWER", 0, 12))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.rank(null, null, "UNKNOWN", 0, 12))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.rank(null, null, "REVIEW", -1, 12))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.rank(null, null, "REVIEW", 0, 51))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void zeroLinkedIngredientRemainsDiscoverableAndCategoryAliasesUseTheSameCounts() {
        jdbc.update("DELETE FROM product_ingredients WHERE ingredient_id = ?", INGREDIENT_ID);
        assertThat(service.options().ingredients()).filteredOn(item -> item.id().equals(INGREDIENT_ID))
                .singleElement().extracting(IngredientRankingDtos.IngredientOption::productCount).isEqualTo(0L);
        assertThat(service.rank(INGREDIENT_ID, null, "REVIEW", 0, 12).categories()).isEmpty();
        addProduct("ranking-sunscreen", "선크림", "선크림", "PUBLISHED", 1);
        var aliases = service.rank(INGREDIENT_ID, "선케어", "FIREPOWER", 0, 12);
        assertThat(aliases.content()).hasSize(1);
        assertThat(aliases.categories()).containsExactly(new IngredientRankingDtos.CategoryOption("선케어", 1));
        assertThat(service.rank(INGREDIENT_ID, "선크림", "FIREPOWER", 0, 12).content()).hasSize(1);
    }

    @Test
    void sourceBackedAmpouleIsDiscoverableWithoutClaimingCompleteOfficialIngredients() {
        assertThat(service.rank("hyaluronic-acid", "앰플", "FIREPOWER", 0, 12).content())
                .filteredOn(item -> item.product().id().equals("hwahae-2153055"))
                .singleElement().satisfies(item -> {
                    assertThat(item.concentrationNote()).contains("하이알루로닉애씨드(0.001ppb)", "53번째");
                    assertThat(item.reviewCount()).isZero();
                    assertThat(item.reviewScore()).isNull();
                });
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM product_ingredient_evidence
                WHERE product_id = 'hwahae-2153055' AND source_url LIKE 'https://www.wellage.co.kr/%'
                """, Integer.class)).isEqualTo(2);
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM product_ingredient_sources
                WHERE product_id = 'hwahae-2153055' AND published = TRUE
                """, Integer.class)).isZero();
    }

    @Test
    void verifiedAmountAddsEvidenceButLargerNumberDoesNotAddMoreScore() {
        jdbc.update("UPDATE product_ingredients SET display_order = 1 WHERE product_id IN (?, ?)",
                "ranking-ampoule-a", "ranking-ampoule-b");
        addAmountClaim("ranking-ampoule-a", "0.1");
        addAmountClaim("ranking-ampoule-b", "10");

        var ranked = firepowerService.rankProducts(INGREDIENT_ID, 50).products();
        var lower = ranked.stream().filter(item -> item.product().id().equals("ranking-ampoule-a"))
                .findFirst().orElseThrow();
        var higher = ranked.stream().filter(item -> item.product().id().equals("ranking-ampoule-b"))
                .findFirst().orElseThrow();
        var withoutClaim = ranked.stream().filter(item -> item.product().id().equals("ranking-toner"))
                .findFirst().orElseThrow();

        assertThat(lower.amount().displayValue()).isEqualTo("0.1%");
        assertThat(higher.amount().displayValue()).isEqualTo("10%");
        assertThat(lower.firepowerScore()).isEqualTo(higher.firepowerScore());
        assertThat(lower.breakdown().formulationClue()).isEqualTo(16);
        assertThat(lower.breakdown().amountEvidence()).isEqualTo(4);
        assertThat(withoutClaim.breakdown().amountEvidence()).isZero();
        assertThat(service.rank(INGREDIENT_ID, "앰플", "FIREPOWER", 0, 12).content())
                .allSatisfy(item -> assertThat(item.amount()).isNotNull());
    }

    private void addProduct(String id, String name, String category, String status, int position) {
        jdbc.update("""
                INSERT INTO products (id, brand, name, category, base_score, benefit, sub_benefit, price, tone, publication_status)
                VALUES (?, '랭킹 테스트', ?, ?, 90, '보습', '보습', 10000, 'rose', ?)
                """, id, name, category, status);
        jdbc.update("INSERT INTO product_ingredients (product_id, ingredient_id, display_order) VALUES (?, ?, ?)",
                id, INGREDIENT_ID, position);
    }

    private void addReview(String productId, String status, int score) {
        String userId = UUID.randomUUID().toString();
        String nickname = "랭킹" + userId.substring(0, 8);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status)
                VALUES (?, ?, 'test-unused', ?, ?, 'USER', ?)
                """, userId, userId + "@example.com", nickname,
                ActivityNickname.key(ActivityNickname.normalize(nickname)), status);
        jdbc.update("""
                INSERT INTO reviews (id, product_id, user_id, template_id, total_score, content, skin_type, usage_period, repurchase_yn)
                VALUES (?, ?, ?, 'review-essence-serum-v1', ?, '직접 작성한 테스트 리뷰입니다.', '건성', 'ONE_MONTH', TRUE)
                """, UUID.randomUUID().toString(), productId, userId, score);
    }

    private void addAmountClaim(String productId, String amount) {
        jdbc.update("""
                INSERT INTO product_ingredient_amount_claims (
                    product_id, ingredient_id, kind, min_amount, max_amount, unit, basis,
                    substance_basis, raw_claim_text, source_type, source_url, page_title,
                    source_ingredient_name, checked_at, verification_status
                ) VALUES (?, ?, 'EXACT', ?, ?, 'PERCENT', 'W_V', 'PURE_INGREDIENT',
                          ?, 'TEST_REPORT', ?, '랭킹 함량 시험성적서', '랭킹 테스트 성분',
                          DATE '2026-09-11', 'VERIFIED')
                """, productId, INGREDIENT_ID, new java.math.BigDecimal(amount),
                new java.math.BigDecimal(amount), amount + "%", "https://example.com/" + productId);
    }
}
