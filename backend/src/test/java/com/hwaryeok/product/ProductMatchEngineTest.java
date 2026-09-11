package com.hwaryeok.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Set;

import com.hwaryeok.ingredient.Ingredient;
import com.hwaryeok.ingredient.IngredientStatus;
import com.hwaryeok.ingredient.ProductIngredient;
import com.hwaryeok.ingredient.ProductIngredientAmountClaim;
import com.hwaryeok.ingredient.ProductIngredientAmountService;
import com.hwaryeok.ingredient.ProductIngredientId;
import com.hwaryeok.ingredient.ProductIngredientRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class ProductMatchEngineTest {

    @Test
    void ignoresBrandAndLegacyBaseScoreWhenIngredientEvidenceIsEqual() {
        ProductIngredientRepository repository = Mockito.mock(ProductIngredientRepository.class);
        Ingredient ingredient = ingredient("ceramide", "세라마이드 NP", "A", Set.of("장벽", "보습"));
        Product famous = new Product("famous", "유명 브랜드", "유명 크림", "크림", 99, "인기", "베스트", 50000, "rose", null);
        Product newBrand = new Product("new", "신생 브랜드", "장벽 크림", "크림", 45, "장벽", "보습", 25000, "sage", null);
        List<ProductIngredient> relations = List.of(
                new ProductIngredient(famous, ingredient, 1, "핵심 성분"),
                new ProductIngredient(newBrand, ingredient, 1, "핵심 성분")
        );
        when(repository.findByProductIds(Set.of("famous", "new"))).thenReturn(relations);

        Map<String, ProductMatchResult> results = new ProductMatchEngine(repository).evaluateAll(
                List.of(famous, newBrand), ProductMatchProfile.neutral()
        );

        assertThat(results.get("famous").score()).isEqualTo(results.get("new").score());
        assertThat(results.get("new").ingredientQualityScore()).isEqualTo(95);
    }

    @Test
    void scoresProductsWithoutLinkedIngredientsConservatively() {
        ProductIngredientRepository repository = Mockito.mock(ProductIngredientRepository.class);
        Product product = new Product("popular", "유명 브랜드", "인기 제품", "크림", 100, "베스트", "급상승", 50000, "rose", null);
        when(repository.findByProductId("popular")).thenReturn(List.of());

        ProductMatchResult result = new ProductMatchEngine(repository).evaluate(product, ProductMatchProfile.neutral());

        assertThat(result.score()).isEqualTo(42);
        assertThat(result.confidenceLevel()).isEqualTo("LOW");
        assertThat(result.reasons()).anyMatch(reason -> reason.contains("보수적으로"));
    }

    @Test
    void verifiedAmountOnlyRaisesDataConfidenceAndAlwaysExplainsItsSource() {
        ProductIngredientRepository repository = Mockito.mock(ProductIngredientRepository.class);
        ProductIngredientAmountService amountService = Mockito.mock(ProductIngredientAmountService.class);
        Ingredient ingredient = ingredient(
                "hyaluronic-acid", "히알루론산", "A", Set.of("보습", "장벽", "진정", "붉은기")
        );
        when(ingredient.getSkinTypeFeatures()).thenReturn(Map.of("복합성", "적합"));
        when(ingredient.getConcernFeatures()).thenReturn(Map.of(
                "속건조", "적합", "피부 장벽", "적합", "민감", "적합", "붉은기", "적합"
        ));
        Product product = new Product(
                "verified-amount", "테스트", "검증 함량 앰플", "앰플", 90,
                "보습", "장벽", 20000, "rose", null
        );
        ProductIngredient relation = new ProductIngredient(product, ingredient, 1, "전성분 첫 번째", true);
        ProductIngredientId id = new ProductIngredientId(product.getId(), ingredient.getId());
        when(repository.findByProductId(product.getId())).thenReturn(List.of(relation));
        when(amountService.findVerifiedClaims(Set.of(product.getId())))
                .thenReturn(Map.of(id, Mockito.mock(ProductIngredientAmountClaim.class)));

        ProductMatchProfile richProfile = new ProductMatchProfile(
                "복합성", "LOW", "HIGH", "HIGH", "FREQUENT", "LONG", "FREQUENT", "HIGH",
                "LIGHT", "STANDARD", "DAILY",
                List.of("속건조·당김", "붉은기·민감", "장벽·각질"), List.of(), List.of("볼"),
                List.of("냉난방 건조"), List.of("메이크업 전", "이중 세안", "고기능성 성분 사용")
        );
        ProductMatchResult withoutAmount = new ProductMatchEngine(repository).evaluate(product, richProfile);
        ProductMatchResult withAmount = new ProductMatchEngine(repository, amountService).evaluate(product, richProfile);

        assertThat(withAmount.ingredientQualityScore()).isEqualTo(withoutAmount.ingredientQualityScore());
        assertThat(withAmount.compatibilityScore()).isEqualTo(withoutAmount.compatibilityScore());
        assertThat(withAmount.dataConfidenceScore()).isGreaterThan(withoutAmount.dataConfidenceScore());
        assertThat(withAmount.reasons()).first().asString().contains("검수된 출처", "함량 근거");
    }

    private Ingredient ingredient(String id, String name, String evidence, Set<String> tags) {
        Ingredient ingredient = Mockito.mock(Ingredient.class);
        when(ingredient.getId()).thenReturn(id);
        when(ingredient.getName()).thenReturn(name);
        when(ingredient.getEnglishName()).thenReturn(name);
        when(ingredient.getEvidenceLevel()).thenReturn(evidence);
        when(ingredient.getStatus()).thenReturn(IngredientStatus.GOOD);
        when(ingredient.getTags()).thenReturn(tags);
        when(ingredient.getSkinTypeFeatures()).thenReturn(Map.of());
        when(ingredient.getConcernFeatures()).thenReturn(Map.of());
        return ingredient;
    }
}
