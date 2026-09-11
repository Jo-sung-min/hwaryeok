package com.hwaryeok.ingredient;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class AdminProductIngredientServiceTest {

    @Autowired private AdminProductIngredientService service;
    @Autowired private IngredientService ingredientService;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void reordersRelationsWithoutDeletingRetainedAmountClaimsOrEvidence() {
        ProductIngredientsResponse response = service.replace(
                "hwahae-2153055",
                new AdminProductIngredientRequest(List.of(
                        new AdminProductIngredientRequest.Item("hyaluronic-acid", "공식 함량", true),
                        new AdminProductIngredientRequest.Item("panthenol", "공식 전성분", false)
                ))
        );

        assertThat(response.ingredients()).extracting(ProductIngredientItemResponse::id)
                .containsExactly("hyaluronic-acid", "panthenol");
        assertThat(response.ingredients().getFirst().amount()).isNotNull();
        assertThat(response.ingredients().getFirst().amount().displayValue()).isEqualTo("0.001 ppb");
        assertThat(response.ingredients().getFirst().isKeyIngredient()).isTrue();
        assertThat(jdbc.queryForObject("""
                SELECT verification_status FROM product_ingredient_amount_claims
                WHERE product_id = 'hwahae-2153055' AND ingredient_id = 'hyaluronic-acid'
                """, String.class)).isEqualTo("VERIFIED");
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM product_ingredient_evidence
                WHERE product_id = 'hwahae-2153055'
                """, Integer.class)).isEqualTo(2);
    }

    @Test
    void removingRelationMarksClaimStaleAndReaddingDoesNotRepublishIt() {
        service.replace(
                "hwahae-2153055",
                new AdminProductIngredientRequest(List.of(
                        new AdminProductIngredientRequest.Item("panthenol", "공식 전성분", false)
                ))
        );

        assertThat(jdbc.queryForObject("""
                SELECT verification_status FROM product_ingredient_amount_claims
                WHERE product_id = 'hwahae-2153055' AND ingredient_id = 'hyaluronic-acid'
                """, String.class)).isEqualTo("STALE");
        assertThat(ingredientService.findProductIngredients("hwahae-2153055", null, null).verifiedAmountCount())
                .isZero();

        ProductIngredientsResponse admin = service.replace(
                "hwahae-2153055",
                new AdminProductIngredientRequest(List.of(
                        new AdminProductIngredientRequest.Item("panthenol", "공식 전성분", false),
                        new AdminProductIngredientRequest.Item("hyaluronic-acid", "재연결", true)
                ))
        );

        assertThat(admin.ingredients()).filteredOn(item -> item.id().equals("hyaluronic-acid"))
                .singleElement().satisfies(item -> {
                    assertThat(item.amount()).isNotNull();
                    assertThat(item.amount().verificationStatus()).isEqualTo(IngredientAmountVerificationStatus.STALE);
                });
        assertThat(ingredientService.findProductIngredients("hwahae-2153055", null, null).ingredients())
                .filteredOn(item -> item.id().equals("hyaluronic-acid"))
                .singleElement().extracting(ProductIngredientItemResponse::amount).isNull();
    }
}
