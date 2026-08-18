package com.hwaryeok.preference;

import com.hwaryeok.ingredient.IngredientResponse;

public record PreferredIngredientItemResponse(
        int priority,
        IngredientResponse ingredient
) {
    public static PreferredIngredientItemResponse from(UserPreferredIngredient preference) {
        return new PreferredIngredientItemResponse(
                preference.getPriority(), IngredientResponse.from(preference.getIngredient())
        );
    }
}
