package com.hwaryeok.auth.oauth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.registration.ClientRegistration;

class OAuthClientConfigTest {

    @Test
    void kakaoAuthorizationRequestsNoOptionalProfileScopes() {
        ConfiguredClientRegistrationRepository registrations = new OAuthClientConfig()
                .clientRegistrationRepository("rest-api-key", "client-secret");

        ClientRegistration kakao = registrations.findByRegistrationId("kakao");

        assertThat(kakao).isNotNull();
        assertThat(kakao.getScopes()).isEmpty();
        assertThat(kakao.getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName()).isEqualTo("id");
        assertThat(registrations.configuredRegistrationIds()).containsExactly("kakao");
    }
}
