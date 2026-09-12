package com.hwaryeok.auth;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "현재 비밀번호를 입력해주세요.")
        @Size(max = 64, message = "현재 비밀번호는 64자 이하여야 해요.")
        String currentPassword,

        @NotBlank(message = "새 비밀번호를 입력해주세요.")
        @Size(min = 8, max = 64, message = "새 비밀번호는 8~64자로 입력해주세요.")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d])[\\x21-\\x7E]{8,64}$",
                message = "새 비밀번호에는 영문, 숫자, 특수문자가 각각 하나 이상 필요해요."
        )
        String newPassword,

        @NotBlank(message = "새 비밀번호 확인을 입력해주세요.")
        @Size(max = 64, message = "새 비밀번호 확인은 64자 이하여야 해요.")
        String newPasswordConfirm
) {
    @AssertTrue(message = "새 비밀번호 확인이 일치하지 않아요.")
    public boolean isNewPasswordConfirmed() {
        return newPassword != null && newPassword.equals(newPasswordConfirm);
    }
}
