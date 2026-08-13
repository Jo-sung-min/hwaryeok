package com.hwaryeok.auth.oauth;

import java.io.IOException;
import java.util.Set;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class OAuthLoginFailureHandler implements AuthenticationFailureHandler {

    private static final Set<String> PUBLIC_ERROR_CODES = Set.of(
            "unsupported_provider", "email_not_verified", "profile_missing", "email_required",
            "email_already_exists", "account_not_found", "account_unavailable"
    );

    private final String frontendBaseUrl;

    public OAuthLoginFailureHandler(@Value("${app.oauth.frontend-base-url:http://localhost:3000}") String frontendBaseUrl) {
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {
        String code = findPublicErrorCode(exception);
        if (!PUBLIC_ERROR_CODES.contains(code)) code = "oauth_failed";

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/oauth/callback")
                .queryParam("status", "error")
                .queryParam("error", code)
                .build()
                .encode()
                .toUriString();
        response.sendRedirect(redirectUrl);
    }

    private String findPublicErrorCode(Throwable exception) {
        Throwable current = exception;
        while (current != null) {
            if (current instanceof OAuth2AuthenticationException oauthException
                    && PUBLIC_ERROR_CODES.contains(oauthException.getError().getErrorCode())) {
                return oauthException.getError().getErrorCode();
            }
            current = current.getCause();
        }
        return "oauth_failed";
    }
}
