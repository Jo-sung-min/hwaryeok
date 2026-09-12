package com.hwaryeok.auth.oauth;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;

import com.hwaryeok.user.User;
import com.hwaryeok.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class OAuthAccountServiceTest {

    @Autowired
    private OAuthAccountService oauthAccountService;

    @Autowired
    private OAuthAccountRepository oauthAccountRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void createsAndReusesKakaoAccountByMemberIdWithoutEmail() {
        String kakaoMemberId = "kakao-" + UUID.randomUUID();

        OAuthLoginResult first = oauthAccountService.login(new OAuthProfile(
                OAuthProvider.KAKAO,
                kakaoMemberId,
                null,
                "카카오 회원"
        ));
        OAuthLoginResult second = oauthAccountService.login(new OAuthProfile(
                OAuthProvider.KAKAO,
                kakaoMemberId,
                "changed@example.com",
                "변경된 프로필"
        ));

        assertThat(first.newUser()).isTrue();
        assertThat(first.user().getEmail()).isNull();
        assertThat(first.user().getRole()).isEqualTo("USER");
        assertThat(second.newUser()).isFalse();
        assertThat(second.user().getId()).isEqualTo(first.user().getId());
        assertThat(oauthAccountRepository.findByProviderAndProviderUserId("KAKAO", kakaoMemberId))
                .get()
                .extracting(OAuthAccount::getUserId)
                .isEqualTo(first.user().getId());
    }

    @Test
    void neverAutoLinksKakaoAccountToPasswordAccountWithTheSameEmail() {
        String email = "separate-" + UUID.randomUUID() + "@example.com";
        Instant now = Instant.now();
        User passwordUser = userRepository.saveAndFlush(new User(
                UUID.randomUUID().toString(),
                email,
                "password-hash",
                "이메일 회원",
                "USER",
                "ACTIVE",
                now,
                now
        ));

        OAuthLoginResult kakaoLogin = oauthAccountService.login(new OAuthProfile(
                OAuthProvider.KAKAO,
                "kakao-" + UUID.randomUUID(),
                email,
                "카카오 회원"
        ));

        assertThat(kakaoLogin.user().getId()).isNotEqualTo(passwordUser.getId());
        assertThat(kakaoLogin.user().getEmail()).isNull();
        assertThat(userRepository.findByEmail(email)).contains(passwordUser);
    }
}
