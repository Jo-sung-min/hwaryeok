package com.hwaryeok.auth;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/password")
public class UserPasswordController {

    private final AuthService authService;

    public UserPasswordController(AuthService authService) {
        this.authService = authService;
    }

    @PutMapping
    public AuthTokenResponse change(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        return authService.changePassword(jwt.getSubject(), request);
    }
}
