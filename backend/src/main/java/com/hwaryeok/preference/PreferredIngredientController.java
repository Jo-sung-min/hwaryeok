package com.hwaryeok.preference;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/preferred-ingredients")
public class PreferredIngredientController {

    private final PreferredIngredientService preferredIngredientService;

    public PreferredIngredientController(PreferredIngredientService preferredIngredientService) {
        this.preferredIngredientService = preferredIngredientService;
    }

    @GetMapping
    public PreferredIngredientsResponse get(@AuthenticationPrincipal Jwt jwt) {
        return preferredIngredientService.get(jwt.getSubject());
    }

    @PutMapping
    public PreferredIngredientsResponse save(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody PreferredIngredientsRequest request
    ) {
        return preferredIngredientService.save(jwt.getSubject(), request);
    }
}
