package com.hwaryeok.auth;

import java.util.Arrays;
import java.util.List;

import jakarta.validation.Valid;

import com.hwaryeok.auth.oauth.ConfiguredClientRegistrationRepository;
import com.hwaryeok.auth.oauth.OAuthProvider;
import com.hwaryeok.auth.oauth.OAuthProviderStatus;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final ConfiguredClientRegistrationRepository clientRegistrationRepository;

    public AuthController(AuthService authService, ConfiguredClientRegistrationRepository clientRegistrationRepository) {
        this.authService = authService;
        this.clientRegistrationRepository = clientRegistrationRepository;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public SignupResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public AuthTokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthTokenResponse refresh(@Valid @RequestBody TokenRefreshRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout")
    public LogoutResponse logout(@Valid @RequestBody LogoutRequest request) {
        return authService.logout(request);
    }

    @PostMapping("/oauth/exchange")
    public AuthTokenResponse exchangeOAuthCode(@Valid @RequestBody OAuthExchangeRequest request) {
        return authService.exchangeOAuthCode(request);
    }

    @GetMapping("/oauth/providers")
    public List<OAuthProviderStatus> oauthProviders() {
        return Arrays.stream(OAuthProvider.values())
                .map(provider -> new OAuthProviderStatus(
                        provider.registrationId(),
                        provider.displayName(),
                        clientRegistrationRepository.isConfigured(provider.registrationId()),
                        "/oauth2/authorization/" + provider.registrationId()
                ))
                .toList();
    }

    @GetMapping("/me")
    public AuthUserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return authService.currentUser(jwt.getSubject(), jwt.getClaimAsString("auth_method"));
    }
}
