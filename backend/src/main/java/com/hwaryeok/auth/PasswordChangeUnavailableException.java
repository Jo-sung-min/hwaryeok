package com.hwaryeok.auth;

public class PasswordChangeUnavailableException extends RuntimeException {
    public PasswordChangeUnavailableException() {
        super("카카오 로그인 계정의 비밀번호는 카카오에서 관리해 주세요.");
    }
}
