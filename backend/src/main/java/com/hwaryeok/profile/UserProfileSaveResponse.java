package com.hwaryeok.profile;

import com.hwaryeok.preference.PreferredIngredientsResponse;

public record UserProfileSaveResponse(
        SkinProfileResponse skinProfile,
        PreferredIngredientsResponse preferredIngredients
) {
}
