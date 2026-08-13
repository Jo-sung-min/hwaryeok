package com.hwaryeok.auth.oauth;

public record OAuthSessionResponse(
        boolean authenticated,
        String userId,
        String email,
        String nickname,
        String provider
) {
    public static OAuthSessionResponse anonymous() {
        return new OAuthSessionResponse(false, null, null, null, null);
    }
}
