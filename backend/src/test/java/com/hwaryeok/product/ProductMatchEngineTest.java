package com.hwaryeok.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Set;

import com.hwaryeok.ingredient.Ingredient;
import com.hwaryeok.ingredient.IngredientStatus;
import com.hwaryeok.ingredient.ProductIngredient;
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
