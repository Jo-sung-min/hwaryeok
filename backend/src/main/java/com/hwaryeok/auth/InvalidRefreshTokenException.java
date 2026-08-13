package com.hwaryeok.auth;

public class InvalidRefreshTokenException extends RuntimeException {
    public InvalidRefreshTokenException() {
        super("로그인 세션이 만료되었어요. 다시 로그인해 주세요.");
    }
}
