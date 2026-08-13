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
        String concentrationNote
) {
    public static ProductIngredientItemResponse from(ProductIngredient relation) {
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
                relation.getConcentrationNote()
        );
    }
}
