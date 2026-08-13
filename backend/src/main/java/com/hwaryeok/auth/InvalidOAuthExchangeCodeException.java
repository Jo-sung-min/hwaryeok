package com.hwaryeok.auth;

public class InvalidOAuthExchangeCodeException extends RuntimeException {
    public InvalidOAuthExchangeCodeException() {
        super("간편 로그인 인증이 만료되었어요. 다시 시도해 주세요.");
    }
}
