package com.hwaryeok.preference;

import java.util.List;

public record PreferredIngredientsResponse(
        List<PreferredIngredientItemResponse> content,
        int totalElements
) {
    public static PreferredIngredientsResponse from(List<UserPreferredIngredient> preferences) {
        return new PreferredIngredientsResponse(
                preferences.stream().map(PreferredIngredientItemResponse::from).toList(),
                preferences.size()
        );
    }
}
