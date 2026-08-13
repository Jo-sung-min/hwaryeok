package com.hwaryeok.auth.oauth;

import java.util.Arrays;

public enum OAuthProvider {
    GOOGLE("google", "구글"),
    KAKAO("kakao", "카카오"),
    NAVER("naver", "네이버");

    private final String registrationId;
    private final String displayName;

    OAuthProvider(String registrationId, String displayName) {
        this.registrationId = registrationId;
        this.displayName = displayName;
    }

    public String registrationId() { return registrationId; }
    public String displayName() { return displayName; }

    public static OAuthProvider fromRegistrationId(String registrationId) {
        return Arrays.stream(values())
                .filter(provider -> provider.registrationId.equalsIgnoreCase(registrationId))
                .findFirst()
                .orElseThrow(() -> new OAuthLoginException("unsupported_provider", "지원하지 않는 소셜 로그인 제공자예요."));
    }
}
