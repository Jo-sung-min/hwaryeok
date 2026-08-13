package com.hwaryeok.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OAuthExchangeRequest(
        @NotBlank(message = "인증 코드가 필요해요.")
        @Size(max = 512, message = "인증 코드 형식이 올바르지 않아요.")
        String code
) {
}
