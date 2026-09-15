package com.hwaryeok.auth.oauth;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

@Configuration
public class OAuthClientConfig {

    @Bean
    ConfiguredClientRegistrationRepository clientRegistrationRepository(
            @Value("${app.oauth.kakao.client-id:}") String kakaoClientId,
            @Value("${app.oauth.kakao.client-secret:}") String kakaoClientSecret,
            @Value("${app.oauth.redirect-uri:}") String redirectUri
    ) {
        List<ClientRegistration> registrations = isConfigured(kakaoClientId, kakaoClientSecret)
                ? List.of(kakao(kakaoClientId, kakaoClientSecret, redirectUri))
                : List.of();
        return new ConfiguredClientRegistrationRepository(registrations);
    }

    private boolean isConfigured(String clientId, String clientSecret) {
        return !clientId.isBlank() && !clientSecret.isBlank();
    }

    private ClientRegistration kakao(String clientId, String clientSecret, String redirectUri) {
        return base(OAuthProvider.KAKAO, clientId, clientSecret, ClientAuthenticationMethod.CLIENT_SECRET_POST,
                resolvedRedirectUri(redirectUri))
                .authorizationUri("https://kauth.kakao.com/oauth/authorize")
                .tokenUri("https://kauth.kakao.com/oauth/token")
                .userInfoUri("https://kapi.kakao.com/v2/user/me")
                .userNameAttributeName("id")
                .build();
    }

    private ClientRegistration.Builder base(OAuthProvider provider, String clientId, String clientSecret,
                                            ClientAuthenticationMethod authenticationMethod,
                                            String redirectUri) {
        return ClientRegistration.withRegistrationId(provider.registrationId())
                .clientId(clientId)
                .clientSecret(clientSecret)
                .clientAuthenticationMethod(authenticationMethod)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .clientName(provider.displayName());
    }

    private String resolvedRedirectUri(String configuredRedirectUri) {
        if (configuredRedirectUri == null || configuredRedirectUri.isBlank()) {
            return "{baseUrl}/login/oauth2/code/{registrationId}";
        }
        return configuredRedirectUri.trim();
    }
}
