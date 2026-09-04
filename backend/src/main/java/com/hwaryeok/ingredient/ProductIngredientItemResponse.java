package com.hwaryeok.ingredient;

import java.util.List;

public record ProductIngredientItemResponse(
        String id,
        String name,
        String englishName,
        String role,
        String description,
        IngredientStatus status,
        String caution,
        List<String> tags,
        int displayOrder,
        String concentrationNote,
        List<IngredientRegulationResponse> regulations
) {
    public static ProductIngredientItemResponse from(ProductIngredient relation) {
        return from(relation, List.of());
    }

    public static ProductIngredientItemResponse from(
            ProductIngredient relation,
            List<IngredientRegulationResponse> regulations
    ) {
        Ingredient ingredient = relation.getIngredient();
        return new ProductIngredientItemResponse(
                ingredient.getId(),
                ingredient.getName(),
                ingredient.getEnglishName(),
                ingredient.getRole(),
                ingredient.getDescription(),
                ingredient.getStatus(),
                ingredient.getCaution(),
                ingredient.getTags().stream().sorted().toList(),
                relation.getDisplayOrder(),
                relation.getConcentrationNote(),
                regulations == null ? List.of() : List.copyOf(regulations)
        );
    }
}
