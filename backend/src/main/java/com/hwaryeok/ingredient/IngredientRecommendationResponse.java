package com.hwaryeok.ingredient;

import java.util.List;

public record IngredientRecommendationResponse(
        IngredientResponse ingredient,
        String reason,
        List<String> matchedBy,
        boolean preferred
) {
}
