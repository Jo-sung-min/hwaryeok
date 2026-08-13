package com.hwaryeok.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LogoutRequest(
        @NotBlank(message = "리프레시 토큰이 필요해요.")
        @Size(max = 512, message = "리프레시 토큰 형식이 올바르지 않아요.")
        String refreshToken
) {
}
