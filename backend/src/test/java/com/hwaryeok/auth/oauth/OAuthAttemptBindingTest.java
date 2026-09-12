package com.hwaryeok.auth.oauth;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OAuthAttemptBindingTest {

    private static final String VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    private static final String CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

    @Test
    void derivesTheRfc7636Sha256Base64UrlChallenge() {
        assertThat(OAuthAttemptBinding.challengeForVerifier(VERIFIER)).isEqualTo(CHALLENGE);
        assertThat(OAuthAttemptBinding.matches(CHALLENGE, CHALLENGE)).isTrue();
        assertThat(OAuthAttemptBinding.matches(CHALLENGE, "A".repeat(43))).isFalse();
    }

    @Test
    void authorizationRequestKeepsSpringStateAndPkceWhileStoringAttemptOnlyAsAnAttribute() {
        OAuthAttemptAuthorizationRequestResolver resolver = resolver();
        MockHttpServletRequest request = authorizationRequest();
        request.addParameter(OAuthAttemptBinding.CHALLENGE_PARAMETER, CHALLENGE);

        OAuth2AuthorizationRequest resolved = resolver.resolve(request);

        assertThat(resolved).isNotNull();
        assertThat(resolved.getState()).isNotBlank();
        assertThat(resolved.getAdditionalParameters()).containsKeys("code_challenge", "code_challenge_method");
        assertThat((String) resolved.getAttribute(OAuthAttemptBinding.AUTHORIZATION_ATTRIBUTE)).isEqualTo(CHALLENGE);
        assertThat(resolved.getAuthorizationRequestUri()).doesNotContain("attempt_challenge", CHALLENGE);
    }

    @Test
    void authorizationRequestIgnoresMissingMalformedDuplicatedOrUnsupportedAttempts() {
        OAuthAttemptAuthorizationRequestResolver resolver = resolver();

        assertThat(resolver.resolve(authorizationRequest())).isNull();

        MockHttpServletRequest malformed = authorizationRequest();
        malformed.addParameter(OAuthAttemptBinding.CHALLENGE_PARAMETER, "too-short");
        assertThat(resolver.resolve(malformed)).isNull();

        MockHttpServletRequest duplicated = authorizationRequest();
        duplicated.addParameter(OAuthAttemptBinding.CHALLENGE_PARAMETER, CHALLENGE, "A".repeat(43));
        assertThat(resolver.resolve(duplicated)).isNull();

        MockHttpServletRequest unsupported = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        unsupported.setServletPath("/oauth2/authorization/google");
        unsupported.addParameter(OAuthAttemptBinding.CHALLENGE_PARAMETER, CHALLENGE);
        assertThat(resolver.resolve(unsupported)).isNull();
    }

    @Test
    void repositoryCarriesTheChallengeOnlyForTheMatchingSpringState() {
        OAuthAttemptAuthorizationRequestRepository repository = new OAuthAttemptAuthorizationRequestRepository();
        OAuth2AuthorizationRequest authorizationRequest = OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri("https://kauth.kakao.com/oauth/authorize")
                .clientId("client-id")
                .redirectUri("http://localhost:8081/login/oauth2/code/kakao")
                .state("spring-state")
                .attributes(attributes -> attributes.put(
                        OAuthAttemptBinding.AUTHORIZATION_ATTRIBUTE,
                        CHALLENGE
                ))
                .build();
        MockHttpSession session = new MockHttpSession();
        MockHttpServletRequest start = new MockHttpServletRequest();
        start.setSession(session);
        repository.saveAuthorizationRequest(authorizationRequest, start, new MockHttpServletResponse());

        MockHttpServletRequest wrongState = new MockHttpServletRequest();
        wrongState.setSession(session);
        wrongState.addParameter("state", "other-state");
        assertThat(repository.removeAuthorizationRequest(wrongState, new MockHttpServletResponse())).isNull();
        assertThat(OAuthAttemptBinding.callbackChallenge(wrongState)).isNull();

        MockHttpServletRequest callback = new MockHttpServletRequest();
        callback.setSession(session);
        callback.addParameter("state", "spring-state");
        assertThat(repository.removeAuthorizationRequest(callback, new MockHttpServletResponse())).isNotNull();
        assertThat(OAuthAttemptBinding.callbackChallenge(callback)).isEqualTo(CHALLENGE);
        assertThat(repository.loadAuthorizationRequest(callback)).isNull();
    }

    private OAuthAttemptAuthorizationRequestResolver resolver() {
        OAuthClientConfig config = new OAuthClientConfig();
        ConfiguredClientRegistrationRepository registrations =
                config.clientRegistrationRepository("client-id", "client-secret");
        assertThat(registrations.configuredRegistrationIds()).isEqualTo(List.of("kakao"));
        return new OAuthAttemptAuthorizationRequestResolver(registrations);
    }

    private MockHttpServletRequest authorizationRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/kakao");
        request.setServletPath("/oauth2/authorization/kakao");
        request.setScheme("http");
        request.setServerName("localhost");
        request.setServerPort(8081);
        return request;
    }
}
