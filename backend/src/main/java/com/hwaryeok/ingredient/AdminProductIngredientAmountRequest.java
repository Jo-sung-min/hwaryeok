package com.hwaryeok.ingredient;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminProductIngredientAmountRequest(
        @NotNull(message = "함량 표시 방식을 선택해 주세요.")
        IngredientAmountKind kind,

        @DecimalMin(value = "0", inclusive = false, message = "최소 함량은 0보다 커야 해요.")
        @Digits(integer = 12, fraction = 12, message = "최소 함량은 정수 12자리, 소수 12자리 이하여야 해요.")
        BigDecimal minAmount,

        @DecimalMin(value = "0", inclusive = false, message = "최대 함량은 0보다 커야 해요.")
        @Digits(integer = 12, fraction = 12, message = "최대 함량은 정수 12자리, 소수 12자리 이하여야 해요.")
        BigDecimal maxAmount,

        @NotNull(message = "함량 단위를 선택해 주세요.")
        IngredientAmountUnit unit,

        @NotNull(message = "함량 배합 기준을 선택해 주세요.")
        IngredientAmountBasis basis,

        @NotNull(message = "성분 환산 기준을 선택해 주세요.")
        IngredientSubstanceBasis substanceBasis,

        @NotBlank(message = "공식 함량 표기 원문을 입력해 주세요.")
        @Size(max = 500, message = "함량 표기 원문은 500자 이하여야 해요.")
        String rawClaimText,

        @NotNull(message = "함량 출처 종류를 선택해 주세요.")
        IngredientAmountSourceType sourceType,

        @NotBlank(message = "함량 근거 주소를 입력해 주세요.")
        @Size(max = 500, message = "함량 근거 주소는 500자 이하여야 해요.")
        @Pattern(regexp = "^https://\\S+$", message = "함량 근거 주소는 https://로 시작해야 해요.")
        String sourceUrl,

        @NotBlank(message = "근거 페이지 제목을 입력해 주세요.")
        @Size(max = 300, message = "근거 페이지 제목은 300자 이하여야 해요.")
        String pageTitle,

        @NotBlank(message = "출처에 표시된 성분명을 입력해 주세요.")
        @Size(max = 300, message = "출처 성분명은 300자 이하여야 해요.")
        String sourceIngredientName,

        @NotNull(message = "함량 근거 확인일을 입력해 주세요.")
        @PastOrPresent(message = "함량 근거 확인일은 오늘 또는 이전 날짜여야 해요.")
        LocalDate checkedAt,

        @NotNull(message = "함량 검수 상태를 선택해 주세요.")
        IngredientAmountVerificationStatus verificationStatus,

        @Size(max = 500, message = "검수 메모는 500자 이하여야 해요.")
        String reviewNote
) {
}
