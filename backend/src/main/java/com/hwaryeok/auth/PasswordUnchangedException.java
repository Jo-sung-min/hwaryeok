package com.hwaryeok.auth;

public class PasswordUnchangedException extends RuntimeException {
    public PasswordUnchangedException() {
        super("새 비밀번호는 현재 비밀번호와 다르게 입력해 주세요.");
    }
}
