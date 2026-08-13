package com.hwaryeok.auth.oauth;

public record OAuthProviderStatus(
        String id,
        String name,
        boolean configured,
        String authorizationPath
) {
}
