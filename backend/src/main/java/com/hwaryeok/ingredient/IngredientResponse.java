package com.hwaryeok.ingredient;

import java.util.List;

public record IngredientResponse(
        String id,
        String name,
        String englishName,
        String role,
        String description,
        IngredientStatus status,
        String caution,
        List<String> tags,
        String evidenceLevel,
        boolean featured,
        int displayOrder
) {
    public static IngredientResponse from(Ingredient ingredient) {
        return new IngredientResponse(
                ingredient.getId(),
                ingredient.getName(),
                ingredient.getEnglishName(),
                ingredient.getRole(),
                ingredient.getDescription(),
                ingredient.getStatus(),
                ingredient.getCaution(),
                ingredient.getTags().stream().sorted().toList(),
                ingredient.getEvidenceLevel(),
                ingredient.isFeatured(),
                ingredient.getDisplayOrder()
        );
    }
}
