package com.hwaryeok.auth;

import com.hwaryeok.user.User;

public record AuthUserResponse(
        String id,
        String email,
        String nickname,
        String role,
        String authMethod
) {
    public static AuthUserResponse from(User user, String authMethod) {
        return new AuthUserResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getRole(),
                authMethod
        );
    }
}
