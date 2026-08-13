package com.hwaryeok.ingredient;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import com.hwaryeok.product.ProductResponse;

public record IngredientDetailResponse(
        String id,
        String name,
        String englishName,
        String role,
        String description,
        IngredientStatus status,
        String caution,
        List<String> tags,
        Map<String, String> skinTypeFeatures,
        Map<String, String> concernFeatures,
        List<ProductResponse> products
) {
    public static IngredientDetailResponse from(Ingredient ingredient, List<ProductIngredient> relations) {
        return new IngredientDetailResponse(
                ingredient.getId(),
                ingredient.getName(),
                ingredient.getEnglishName(),
                ingredient.getRole(),
                ingredient.getDescription(),
                ingredient.getStatus(),
                ingredient.getCaution(),
                ingredient.getTags().stream().sorted().toList(),
                new TreeMap<>(ingredient.getSkinTypeFeatures()),
                new TreeMap<>(ingredient.getConcernFeatures()),
                relations.stream().map(ProductIngredient::getProduct).map(ProductResponse::from).toList()
        );
    }
}
