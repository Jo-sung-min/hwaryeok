package com.hwaryeok.ingredient;

import java.util.List;

public record ProductIngredientsResponse(
        String productId,
        int totalCount,
        long goodCount,
        long cautionCount,
        long neutralCount,
        List<ProductIngredientItemResponse> ingredients
) {
    public static ProductIngredientsResponse from(String productId, List<ProductIngredient> allRelations,
                                                  List<ProductIngredient> filteredRelations) {
        return new ProductIngredientsResponse(
                productId,
                allRelations.size(),
                count(allRelations, IngredientStatus.GOOD),
                count(allRelations, IngredientStatus.CAUTION),
                count(allRelations, IngredientStatus.NEUTRAL),
                filteredRelations.stream().map(ProductIngredientItemResponse::from).toList()
        );
    }

    private static long count(List<ProductIngredient> relations, IngredientStatus status) {
        return relations.stream().filter(relation -> relation.getIngredient().getStatus() == status).count();
    }
}
