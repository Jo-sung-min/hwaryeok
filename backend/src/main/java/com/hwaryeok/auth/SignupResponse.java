package com.hwaryeok.auth;

import java.time.Instant;

import com.hwaryeok.user.User;

public record SignupResponse(
        String userId,
        String email,
        String nickname,
        String nextStep,
        Instant createdAt
) {
    public static SignupResponse from(User user) {
        return new SignupResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                "SKIN_PROFILE",
                user.getCreatedAt()
        );
    }
}
