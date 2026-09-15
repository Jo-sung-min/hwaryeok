package com.hwaryeok.auth.oauth;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class OAuthProductionConfigurationValidatorTest {

    @Test
    void acceptsMatchingVercelProductionUrls() {
        assertThatCode(() -> OAuthProductionConfigurationValidator.validate(
                "rest-api-key",
                "client-secret",
                "https://www.hwaryeok.co.kr",
                "https://www.hwaryeok.co.kr/login/oauth2/code/kakao",
                "postgres"
        )).doesNotThrowAnyException();
    }

    @Test
    void rejectsMissingOrInsecureProductionCallbacks() {
        assertThatThrownBy(() -> OAuthProductionConfigurationValidator.validate(
                "rest-api-key", "client-secret", "https://www.hwaryeok.co.kr", "", "postgres"
        )).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("OAUTH_REDIRECT_URI is required");

        assertThatThrownBy(() -> OAuthProductionConfigurationValidator.validate(
                "rest-api-key",
                "client-secret",
                "http://www.hwaryeok.co.kr",
                "http://www.hwaryeok.co.kr/login/oauth2/code/kakao",
                "postgres"
        )).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("OAUTH_FRONTEND_BASE_URL must be a valid HTTPS URL");
    }

    @Test
    void rejectsDifferentFrontendAndCallbackOrigins() {
        assertThatThrownBy(() -> OAuthProductionConfigurationValidator.validate(
                "rest-api-key",
                "client-secret",
                "https://www.hwaryeok.co.kr",
                "https://preview.hwaryeok.co.kr/login/oauth2/code/kakao",
                "postgres"
        )).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("must use the same origin");
    }

    @Test
    void keepsHttpLocalDevelopmentAvailable() {
        assertThatCode(() -> OAuthProductionConfigurationValidator.validate(
                "rest-api-key",
                "client-secret",
                "http://localhost:3001",
                "http://localhost:3001/login/oauth2/code/kakao",
                "local"
        )).doesNotThrowAnyException();
    }
}
