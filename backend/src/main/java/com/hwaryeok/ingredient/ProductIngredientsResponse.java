package com.hwaryeok.ingredient;

import java.util.List;
import java.util.Map;

public record ProductIngredientsResponse(
        String productId,
        int totalCount,
        long goodCount,
        long cautionCount,
        long neutralCount,
        List<ProductIngredientItemResponse> ingredients,
        ProductIngredientSourceResponse source
) {
    public static ProductIngredientsResponse from(String productId, List<ProductIngredient> allRelations,
                                                  List<ProductIngredient> filteredRelations) {
        return from(productId, allRelations, filteredRelations, null);
    }

    public static ProductIngredientsResponse from(String productId, List<ProductIngredient> allRelations,
                                                  List<ProductIngredient> filteredRelations,
                                                  ProductIngredientSourceResponse source) {
        return from(productId, allRelations, filteredRelations, source, Map.of());
    }

    public static ProductIngredientsResponse from(String productId, List<ProductIngredient> allRelations,
                                                  List<ProductIngredient> filteredRelations,
                                                  ProductIngredientSourceResponse source,
                                                  Map<String, List<IngredientRegulationResponse>> regulations) {
        return new ProductIngredientsResponse(
                productId,
                allRelations.size(),
                count(allRelations, IngredientStatus.GOOD),
                count(allRelations, IngredientStatus.CAUTION),
                count(allRelations, IngredientStatus.NEUTRAL),
                filteredRelations.stream()
                        .map(relation -> ProductIngredientItemResponse.from(
                                relation,
                                regulations.getOrDefault(relation.getIngredient().getId(), List.of())
                        ))
                        .toList(),
                source
        );
    }

    private static long count(List<ProductIngredient> relations, IngredientStatus status) {
        return relations.stream().filter(relation -> relation.getIngredient().getStatus() == status).count();
    }
}
