package com.hwaryeok.auth.oauth;

import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.hwaryeok.auth.token.OAuthExchangeCodeService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class OAuthLoginSuccessHandler implements AuthenticationSuccessHandler {

    private final String frontendBaseUrl;
    private final OAuthExchangeCodeService exchangeCodeService;

    public OAuthLoginSuccessHandler(
            @Value("${app.oauth.frontend-base-url:http://localhost:3000}") String frontendBaseUrl,
            OAuthExchangeCodeService exchangeCodeService
    ) {
        this.frontendBaseUrl = frontendBaseUrl;
        this.exchangeCodeService = exchangeCodeService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String provider = String.valueOf(principal.getAttribute(HwaryeokOAuth2UserService.PROVIDER_ATTRIBUTE));
        String userId = String.valueOf(principal.getAttribute(HwaryeokOAuth2UserService.USER_ID_ATTRIBUTE));
        boolean newUser = Boolean.TRUE.equals(principal.getAttribute(HwaryeokOAuth2UserService.NEW_USER_ATTRIBUTE));
        String exchangeCode = exchangeCodeService.issue(userId, OAuthProvider.fromRegistrationId(provider), newUser);
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        String redirectUrl = UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/api/auth/oauth/callback")
                .queryParam("code", exchangeCode)
                .queryParam("provider", provider)
                .queryParam("newUser", newUser)
                .build()
                .encode()
                .toUriString();
        response.sendRedirect(redirectUrl);
    }
}
