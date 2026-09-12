package com.hwaryeok.auth.oauth;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

@Component
public class OAuthAttemptAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver delegate;
    private final ConfiguredClientRegistrationRepository registrations;

    public OAuthAttemptAuthorizationRequestResolver(ConfiguredClientRegistrationRepository registrations) {
        this.registrations = registrations;
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(registrations);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        String challenge = attemptChallenge(request);
        if (!isKakaoAuthorizationRequest(request) || !isKakaoConfigured() || challenge == null) return null;
        return bindAttempt(delegate.resolve(request), challenge);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        String challenge = attemptChallenge(request);
        if (!OAuthProvider.KAKAO.registrationId().equals(clientRegistrationId)
                || !isKakaoConfigured()
                || challenge == null) {
            return null;
        }
        return bindAttempt(delegate.resolve(request, clientRegistrationId), challenge);
    }

    private OAuth2AuthorizationRequest bindAttempt(
            OAuth2AuthorizationRequest authorizationRequest,
            String challenge
    ) {
        if (authorizationRequest == null) return null;

        return OAuth2AuthorizationRequest.from(authorizationRequest)
                .attributes(attributes -> attributes.put(
                        OAuthAttemptBinding.AUTHORIZATION_ATTRIBUTE,
                        challenge
                ))
                .build();
    }

    private String attemptChallenge(HttpServletRequest request) {
        String[] challenges = request.getParameterValues(OAuthAttemptBinding.CHALLENGE_PARAMETER);
        return challenges != null
                && challenges.length == 1
                && OAuthAttemptBinding.isValidChallenge(challenges[0])
                ? challenges[0]
                : null;
    }

    private boolean isKakaoConfigured() {
        return registrations.isConfigured(OAuthProvider.KAKAO.registrationId());
    }

    private boolean isKakaoAuthorizationRequest(HttpServletRequest request) {
        String servletPath = request.getServletPath();
        if (servletPath == null || servletPath.isBlank()) {
            String requestUri = request.getRequestURI();
            String contextPath = request.getContextPath();
            servletPath = contextPath != null && !contextPath.isBlank() && requestUri.startsWith(contextPath)
                    ? requestUri.substring(contextPath.length())
                    : requestUri;
        }
        return ("/oauth2/authorization/" + OAuthProvider.KAKAO.registrationId()).equals(servletPath);
    }
}
