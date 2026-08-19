package com.hwaryeok.profile;

import com.hwaryeok.preference.PreferredIngredientService;
import com.hwaryeok.preference.PreferredIngredientsRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final SkinProfileService skinProfileService;
    private final PreferredIngredientService preferredIngredientService;

    public UserProfileService(
            SkinProfileService skinProfileService,
            PreferredIngredientService preferredIngredientService
    ) {
        this.skinProfileService = skinProfileService;
        this.preferredIngredientService = preferredIngredientService;
    }

    @Transactional
    public UserProfileSaveResponse save(String userId, UserProfileSaveRequest request) {
        var skinProfile = skinProfileService.save(userId, request.skinProfile());
        var preferredIngredients = preferredIngredientService.save(
                userId,
                new PreferredIngredientsRequest(request.ingredientIds())
        );
        return new UserProfileSaveResponse(skinProfile, preferredIngredients);
    }
}
