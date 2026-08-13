package com.hwaryeok.auth.oauth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;

import org.junit.jupiter.api.Test;

class OAuthProfileTest {

    @Test
    void mapsGoogleKakaoAndNaverProfiles() {
        OAuthProfile google = OAuthProfile.from("google", Map.of(
                "sub", "google-1", "email", "User@Example.com", "email_verified", true, "name", "구글봄"
        ));
        OAuthProfile kakao = OAuthProfile.from("kakao", Map.of(
                "id", 12345L,
                "kakao_account", Map.of(
                        "email", "kakao@example.com",
                        "is_email_verified", true,
                        "profile", Map.of("nickname", "카카오봄")
                )
        ));
        OAuthProfile naver = OAuthProfile.from("naver", Map.of(
                "response", Map.of("id", "naver-1", "email", "naver@example.com", "nickname", "네이버봄")
        ));

        assertThat(google.email()).isEqualTo("user@example.com");
        assertThat(google.nickname()).isEqualTo("구글봄");
        assertThat(kakao.providerUserId()).isEqualTo("12345");
        assertThat(kakao.nickname()).isEqualTo("카카오봄");
        assertThat(naver.provider()).isEqualTo(OAuthProvider.NAVER);
        assertThat(naver.nickname()).isEqualTo("네이버봄");
    }

    @Test
    void rejectsUnverifiedProviderEmail() {
        assertThatThrownBy(() -> OAuthProfile.from("google", Map.of(
                "sub", "google-1", "email", "user@example.com", "email_verified", false
        ))).isInstanceOf(OAuthLoginException.class)
                .hasMessageContaining("확인된 구글 이메일");
    }
}
