package com.hwaryeok.profile;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/skin-profile")
public class SkinProfileController {

    private final SkinProfileService skinProfileService;

    public SkinProfileController(SkinProfileService skinProfileService) {
        this.skinProfileService = skinProfileService;
    }

    @GetMapping
    public SkinProfileResponse get(@AuthenticationPrincipal Jwt jwt) {
        return skinProfileService.get(jwt.getSubject());
    }

    @PutMapping
    public SkinProfileResponse save(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SkinProfileRequest request
    ) {
        return skinProfileService.save(jwt.getSubject(), request);
    }
}
