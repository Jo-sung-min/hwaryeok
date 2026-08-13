package com.hwaryeok.auth.oauth;

import java.util.ArrayList;
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
            @Value("${app.oauth.google.client-id:}") String googleClientId,
            @Value("${app.oauth.google.client-secret:}") String googleClientSecret,
            @Value("${app.oauth.kakao.client-id:}") String kakaoClientId,
            @Value("${app.oauth.kakao.client-secret:}") String kakaoClientSecret,
            @Value("${app.oauth.naver.client-id:}") String naverClientId,
            @Value("${app.oauth.naver.client-secret:}") String naverClientSecret
    ) {
        List<ClientRegistration> registrations = new ArrayList<>();
        if (isConfigured(googleClientId, googleClientSecret)) registrations.add(google(googleClientId, googleClientSecret));
        if (isConfigured(kakaoClientId, kakaoClientSecret)) registrations.add(kakao(kakaoClientId, kakaoClientSecret));
        if (isConfigured(naverClientId, naverClientSecret)) registrations.add(naver(naverClientId, naverClientSecret));
        return new ConfiguredClientRegistrationRepository(registrations);
    }

    private boolean isConfigured(String clientId, String clientSecret) {
        return !clientId.isBlank() && !clientSecret.isBlank();
    }

    private ClientRegistration google(String clientId, String clientSecret) {
        return base(OAuthProvider.GOOGLE, clientId, clientSecret, ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .scope("profile", "email")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                .userNameAttributeName("sub")
                .build();
    }

    private ClientRegistration kakao(String clientId, String clientSecret) {
        return base(OAuthProvider.KAKAO, clientId, clientSecret, ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .scope("profile_nickname", "account_email")
                .authorizationUri("https://kauth.kakao.com/oauth/authorize")
                .tokenUri("https://kauth.kakao.com/oauth/token")
                .userInfoUri("https://kapi.kakao.com/v2/user/me")
                .userNameAttributeName("id")
                .build();
    }

    private ClientRegistration naver(String clientId, String clientSecret) {
        return base(OAuthProvider.NAVER, clientId, clientSecret, ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .scope("name", "email", "nickname")
                .authorizationUri("https://nid.naver.com/oauth2.0/authorize")
                .tokenUri("https://nid.naver.com/oauth2.0/token")
                .userInfoUri("https://openapi.naver.com/v1/nid/me")
                .userNameAttributeName("response")
                .build();
    }

    private ClientRegistration.Builder base(OAuthProvider provider, String clientId, String clientSecret,
                                            ClientAuthenticationMethod authenticationMethod) {
        return ClientRegistration.withRegistrationId(provider.registrationId())
                .clientId(clientId)
                .clientSecret(clientSecret)
                .clientAuthenticationMethod(authenticationMethod)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .clientName(provider.displayName());
    }
}
