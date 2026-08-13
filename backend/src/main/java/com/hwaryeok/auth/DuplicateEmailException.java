package com.hwaryeok.auth;

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException() {
        super("이미 가입된 이메일이에요.");
    }
}
