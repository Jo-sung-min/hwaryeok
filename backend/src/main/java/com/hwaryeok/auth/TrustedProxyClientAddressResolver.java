package com.hwaryeok.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
class TrustedProxyClientAddressResolver {

    static final String PROXY_SECRET_HEADER = "X-Hwaryeok-Proxy-Secret";
    static final String CLIENT_ADDRESS_HEADER = "X-Hwaryeok-Client-Address";
    private static final Pattern IP_LITERAL = Pattern.compile("^[0-9A-Fa-f:.]{2,64}$");

    private final String proxySecret;

    TrustedProxyClientAddressResolver(@Value("${app.auth.bff-proxy-secret:}") String proxySecret) {
        this.proxySecret = proxySecret == null ? "" : proxySecret;
        if (!this.proxySecret.isEmpty() && this.proxySecret.length() < 32) {
            throw new IllegalStateException("BFF_PROXY_SECRET must contain at least 32 characters");
        }
    }

    String resolve(HttpServletRequest request) {
        String forwardedAddress = request.getHeader(CLIENT_ADDRESS_HEADER);
        if (hasTrustedSecret(request.getHeader(PROXY_SECRET_HEADER)) && isIpLiteral(forwardedAddress)) {
            return forwardedAddress;
        }
        return request.getRemoteAddr();
    }

    private boolean hasTrustedSecret(String presentedSecret) {
        if (proxySecret.isEmpty() || presentedSecret == null) return false;
        return MessageDigest.isEqual(
                proxySecret.getBytes(StandardCharsets.UTF_8),
                presentedSecret.getBytes(StandardCharsets.UTF_8)
        );
    }

    private boolean isIpLiteral(String value) {
        return value != null && IP_LITERAL.matcher(value).matches();
    }
}
