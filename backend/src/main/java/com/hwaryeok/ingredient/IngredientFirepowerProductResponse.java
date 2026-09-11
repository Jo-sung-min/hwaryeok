package com.hwaryeok.ingredient;

import com.hwaryeok.product.ProductResponse;

public record IngredientFirepowerProductResponse(
        ProductResponse product,
        int firepowerScore,
        String confidence,
        String concentrationNote,
        IngredientAmountResponse amount,
        IngredientFirepowerBreakdown breakdown
) {
}
