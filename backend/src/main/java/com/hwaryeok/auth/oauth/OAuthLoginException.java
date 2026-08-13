package com.hwaryeok.auth.oauth;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;

public class OAuthLoginException extends OAuth2AuthenticationException {
    public OAuthLoginException(String code, String message) {
        super(new OAuth2Error(code), message);
    }
}
