package com.hwaryeok.auth.oauth;

import java.util.List;
import java.util.Map;

import com.hwaryeok.auth.token.OAuthExchangeCodeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OAuthLoginSuccessHandlerTest {

    private static final String CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

    @Mock
    private OAuthExchangeCodeService exchangeCodeService;
    @Mock
    private Authentication authentication;

    @Test
    void issuesAChallengeBoundCodeWithoutPuttingTheChallengeOrUserIdInTheUrl() throws Exception {
        OAuthLoginSuccessHandler handler = new OAuthLoginSuccessHandler("http://localhost:3001", exchangeCodeService);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(OAuthAttemptBinding.CALLBACK_REQUEST_ATTRIBUTE, CHALLENGE);
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(authentication.getPrincipal()).thenReturn(principal());
        when(exchangeCodeService.issue("internal-user-id", OAuthProvider.KAKAO, true, CHALLENGE))
                .thenReturn("one-time-code");

        handler.onAuthenticationSuccess(request, response, authentication);

        assertThat(response.getRedirectedUrl())
                .isEqualTo("http://localhost:3001/api/auth/oauth/callback?code=one-time-code&provider=kakao&newUser=true")
                .doesNotContain(CHALLENGE, "internal-user-id");
        verify(exchangeCodeService).issue("internal-user-id", OAuthProvider.KAKAO, true, CHALLENGE);
    }

    @Test
    void refusesToIssueAnExchangeCodeWhenTheSessionBindingIsMissing() throws Exception {
        OAuthLoginSuccessHandler handler = new OAuthLoginSuccessHandler("http://localhost:3001", exchangeCodeService);
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(authentication.getPrincipal()).thenReturn(principal());

        handler.onAuthenticationSuccess(request, response, authentication);

        assertThat(response.getRedirectedUrl())
                .isEqualTo("http://localhost:3001/api/auth/oauth/callback?status=error&error=oauth_failed");
        verify(exchangeCodeService, never()).issue(
                "internal-user-id",
                OAuthProvider.KAKAO,
                true,
                CHALLENGE
        );
    }

    private DefaultOAuth2User principal() {
        return new DefaultOAuth2User(
                List.of(),
                Map.of(
                        HwaryeokOAuth2UserService.USER_ID_ATTRIBUTE, "internal-user-id",
                        HwaryeokOAuth2UserService.PROVIDER_ATTRIBUTE, "kakao",
                        HwaryeokOAuth2UserService.NEW_USER_ATTRIBUTE, true
                ),
                HwaryeokOAuth2UserService.USER_ID_ATTRIBUTE
        );
    }
}
