package com.hwaryeok.auth.oauth;

import java.net.URI;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
class OAuthProductionConfigurationValidator {

    OAuthProductionConfigurationValidator(
            @Value("${app.oauth.kakao.client-id:}") String kakaoClientId,
            @Value("${app.oauth.kakao.client-secret:}") String kakaoClientSecret,
            @Value("${app.oauth.frontend-base-url:}") String frontendBaseUrl,
            @Value("${app.oauth.redirect-uri:}") String redirectUri,
            @Value("${app.oauth.require-https:true}") boolean requireHttps
    ) {
        validate(kakaoClientId, kakaoClientSecret, frontendBaseUrl, redirectUri, requireHttps);
    }

    static void validate(String clientId, String clientSecret, String frontendBaseUrl,
                         String redirectUri, boolean requireHttps) {
        boolean hasClientId = clientId != null && !clientId.isBlank();
        boolean hasClientSecret = clientSecret != null && !clientSecret.isBlank();
        if (!hasClientId && !hasClientSecret) return;
        if (!hasClientId || !hasClientSecret) {
            throw new IllegalStateException("KAKAO_CLIENT_ID and KAKAO_CLIENT_SECRET must be configured together");
        }
        if (!requireHttps) return;

        URI frontend = requireProductionHttpsUri(frontendBaseUrl, "OAUTH_FRONTEND_BASE_URL");
        URI callback = requireProductionHttpsUri(redirectUri, "OAUTH_REDIRECT_URI");
        if (!isOriginOnly(frontend)) {
            throw new IllegalStateException("OAUTH_FRONTEND_BASE_URL must be an HTTPS origin without a path");
        }
        if (!"/login/oauth2/code/kakao".equals(callback.getRawPath())) {
            throw new IllegalStateException("OAUTH_REDIRECT_URI must end with /login/oauth2/code/kakao");
        }
        if (!origin(frontend).equals(origin(callback))) {
            throw new IllegalStateException("OAUTH_FRONTEND_BASE_URL and OAUTH_REDIRECT_URI must use the same origin");
        }
    }

    private static URI requireProductionHttpsUri(String rawValue, String variableName) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalStateException(variableName + " is required when OAuth HTTPS enforcement is enabled");
        }

        final URI uri;
        try {
            uri = URI.create(rawValue.trim());
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(variableName + " must be a valid HTTPS URL", exception);
        }
        if (!uri.isAbsolute() || !"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                || uri.getRawUserInfo() != null || uri.getRawQuery() != null || uri.getRawFragment() != null) {
            throw new IllegalStateException(variableName + " must be a valid HTTPS URL");
        }
        return uri;
    }

    private static boolean isOriginOnly(URI uri) {
        return uri.getRawPath() == null || uri.getRawPath().isEmpty() || "/".equals(uri.getRawPath());
    }

    private static String origin(URI uri) {
        int port = uri.getPort() < 0 ? 443 : uri.getPort();
        return uri.getHost().toLowerCase(Locale.ROOT) + ":" + port;
    }
}
