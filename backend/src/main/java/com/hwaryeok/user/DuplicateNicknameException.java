package com.hwaryeok.user;

public class DuplicateNicknameException extends RuntimeException {
    public DuplicateNicknameException() {
        super("이미 사용 중인 활동명이에요.");
    }
}
