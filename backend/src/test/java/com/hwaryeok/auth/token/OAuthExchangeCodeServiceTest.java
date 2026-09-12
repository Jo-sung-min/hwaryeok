package com.hwaryeok.auth.token;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import com.hwaryeok.auth.AuthTokenResponse;
import com.hwaryeok.auth.AuthUserResponse;
import com.hwaryeok.auth.InvalidOAuthExchangeCodeException;
import com.hwaryeok.auth.oauth.OAuthAttemptBinding;
import com.hwaryeok.auth.oauth.OAuthProvider;
import com.hwaryeok.user.User;
import com.hwaryeok.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OAuthExchangeCodeServiceTest {

    private static final String VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    private static final String CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
    private static final String RAW_CODE = "one-time-exchange-code";
    private static final String CODE_HASH = "a".repeat(64);

    @Mock
    private OAuthExchangeCodeRepository codeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TokenHashService tokenHashService;
    @Mock
    private AuthTokenService authTokenService;

    private OAuthExchangeCodeService service;
    private User user;
    private AuthTokenResponse expectedTokens;

    @BeforeEach
    void setUp() {
        service = new OAuthExchangeCodeService(
                codeRepository,
                userRepository,
                tokenHashService,
                authTokenService,
                120
        );
        Instant now = Instant.now();
        user = new User("user-id", null, null, "카카오 회원", "USER", "ACTIVE", now, now);
        expectedTokens = new AuthTokenResponse(
                "access-token",
                "refresh-token",
                "Bearer",
                900,
                2_592_000,
                new AuthUserResponse("user-id", null, "카카오 회원", "USER", "kakao", false)
        );
    }

    @Test
    void issueBindsTheCodeToTheChallengeForExactly120Seconds() {
        when(tokenHashService.createOpaqueToken()).thenReturn(RAW_CODE);
        when(tokenHashService.hash(RAW_CODE)).thenReturn(CODE_HASH);

        assertThat(service.issue("user-id", OAuthProvider.KAKAO, false, CHALLENGE)).isEqualTo(RAW_CODE);

        ArgumentCaptor<OAuthExchangeCode> captor = ArgumentCaptor.forClass(OAuthExchangeCode.class);
        verify(codeRepository).save(captor.capture());
        OAuthExchangeCode stored = captor.getValue();
        assertThat(stored.getCodeHash()).isEqualTo(CODE_HASH);
        assertThat(stored.getAttemptChallenge()).isEqualTo(CHALLENGE);
        assertThat(Duration.between(stored.getCreatedAt(), stored.getExpiresAt())).isEqualTo(Duration.ofSeconds(120));
    }

    @Test
    void exchangesOnceWhenTheVerifierMatches() {
        OAuthExchangeCode stored = validStoredCode();
        arrangeExchange(stored);

        assertThat(service.exchange(RAW_CODE, VERIFIER)).isSameAs(expectedTokens);

        assertThat(stored.getUsedAt()).isNotNull();
        verify(authTokenService).issue(user, "kakao");
    }

    @Test
    void rejectsMissingVerifierBeforeLookingUpTheCode() {
        assertThatThrownBy(() -> service.exchange(RAW_CODE, null))
                .isInstanceOf(InvalidOAuthExchangeCodeException.class);
        assertThatThrownBy(() -> service.exchange(RAW_CODE, ""))
                .isInstanceOf(InvalidOAuthExchangeCodeException.class);

        verifyNoInteractions(codeRepository, userRepository, authTokenService);
    }

    @Test
    void rejectsWrongVerifierWithoutConsumingTheLegitimateAttempt() {
        OAuthExchangeCode stored = validStoredCode();
        when(tokenHashService.hash(RAW_CODE)).thenReturn(CODE_HASH);
        when(codeRepository.findByCodeHashForUpdate(CODE_HASH)).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> service.exchange(RAW_CODE, "A".repeat(43)))
                .isInstanceOf(InvalidOAuthExchangeCodeException.class);

        assertThat(stored.getUsedAt()).isNull();
        verify(userRepository, never()).findById("user-id");
        verifyNoInteractions(authTokenService);
    }

    @Test
    void rejectsReplayAfterASuccessfulExchange() {
        OAuthExchangeCode stored = validStoredCode();
        arrangeExchange(stored);

        assertThat(service.exchange(RAW_CODE, VERIFIER)).isSameAs(expectedTokens);
        assertThatThrownBy(() -> service.exchange(RAW_CODE, VERIFIER))
                .isInstanceOf(InvalidOAuthExchangeCodeException.class);

        verify(authTokenService, times(1)).issue(user, "kakao");
    }

    private OAuthExchangeCode validStoredCode() {
        Instant now = Instant.now();
        return new OAuthExchangeCode(
                CODE_HASH,
                "user-id",
                "KAKAO",
                false,
                CHALLENGE,
                now.plusSeconds(120),
                now
        );
    }

    private void arrangeExchange(OAuthExchangeCode stored) {
        when(tokenHashService.hash(RAW_CODE)).thenReturn(CODE_HASH);
        when(codeRepository.findByCodeHashForUpdate(CODE_HASH)).thenReturn(Optional.of(stored));
        when(userRepository.findById("user-id")).thenReturn(Optional.of(user));
        when(authTokenService.issue(user, "kakao")).thenReturn(expectedTokens);
    }
}
