package com.hwaryeok.ingredient;

import java.util.List;

public record IngredientFirepowerResponse(
        String ingredientId,
        String ingredientName,
        String scoreVersion,
        String disclaimer,
        List<IngredientFirepowerProductResponse> products
) {
}
