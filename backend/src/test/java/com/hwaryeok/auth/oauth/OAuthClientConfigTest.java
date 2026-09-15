package com.hwaryeok.auth.oauth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.registration.ClientRegistration;

class OAuthClientConfigTest {

    @Test
    void kakaoAuthorizationRequestsNoOptionalProfileScopes() {
        ConfiguredClientRegistrationRepository registrations = new OAuthClientConfig()
                .clientRegistrationRepository("rest-api-key", "client-secret", "");

        ClientRegistration kakao = registrations.findByRegistrationId("kakao");

        assertThat(kakao).isNotNull();
        assertThat(kakao.getScopes()).isEmpty();
        assertThat(kakao.getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName()).isEqualTo("id");
        assertThat(kakao.getRedirectUri()).isEqualTo("{baseUrl}/login/oauth2/code/{registrationId}");
        assertThat(registrations.configuredRegistrationIds()).containsExactly("kakao");
    }

    @Test
    void kakaoCanUseTheExplicitVercelProxyCallback() {
        ConfiguredClientRegistrationRepository registrations = new OAuthClientConfig()
                .clientRegistrationRepository(
                        "rest-api-key",
                        "client-secret",
                        " https://hwaryeok.example/login/oauth2/code/kakao "
                );

        assertThat(registrations.findByRegistrationId("kakao").getRedirectUri())
                .isEqualTo("https://hwaryeok.example/login/oauth2/code/kakao");
    }
}
