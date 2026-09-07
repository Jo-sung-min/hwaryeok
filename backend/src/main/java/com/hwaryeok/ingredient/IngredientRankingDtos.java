package com.hwaryeok.ingredient;

import java.math.BigDecimal;
import java.util.List;

import com.hwaryeok.product.ProductResponse;

public final class IngredientRankingDtos {

    private IngredientRankingDtos() { }

    public record IngredientOption(
            String id, String name, String englishName, String role, List<String> tags, long productCount
    ) { }

    public record CategoryOption(String name, long productCount) { }

    public record OptionsResponse(List<IngredientOption> ingredients, List<CategoryOption> categories) { }

    public record RankedProduct(
            ProductResponse product, Integer rank, Integer firepowerScore,
            BigDecimal reviewScore, long reviewCount, String concentrationNote
    ) { }

    public record RankingResponse(
            String ingredientId, String ingredientName, String category, String sort,
            List<RankedProduct> content, int page, int size, long totalElements,
            int totalPages, boolean hasNext, List<CategoryOption> categories
    ) { }
}
