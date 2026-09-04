package com.hwaryeok.ingredient;

import java.time.LocalDate;

public record ProductIngredientSourceResponse(
        String sourceType,
        String sourceUrl,
        String pageTitle,
        LocalDate checkedAt,
        int ingredientCount,
        String verificationStatus
) {
}
