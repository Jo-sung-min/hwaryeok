package com.hwaryeok.promotion;

import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PromotionRequest(
        @NotBlank(message = "광고할 제품을 선택해 주세요.")
        @Size(max = 64, message = "제품 ID는 64자 이하여야 해요.")
        String productId,

        @NotNull(message = "관리자 추천점수를 입력해 주세요.")
        @Min(value = 0, message = "추천점수는 0 이상이어야 해요.")
        @Max(value = 100, message = "추천점수는 100 이하여야 해요.")
        Integer recommendationScore,

        @NotBlank(message = "추천 한 줄을 입력해 주세요.")
        @Size(max = 100, message = "추천 한 줄은 100자 이하여야 해요.")
        String headline,

        @NotBlank(message = "관리자 추천 이유를 입력해 주세요.")
        @Size(max = 500, message = "추천 이유는 500자 이하여야 해요.")
        String recommendationReason,

        @NotBlank(message = "쿠팡 공식판매처 주소를 입력해 주세요.")
        @Size(max = 500, message = "판매처 주소는 500자 이하여야 해요.")
        @Pattern(regexp = "^https://\\S+$", message = "판매처 주소는 https://로 시작해야 해요.")
        String destinationUrl,

        @NotNull(message = "신생 브랜드 여부를 선택해 주세요.")
        Boolean emergingBrand,

        @NotNull(message = "광고 상태를 선택해 주세요.")
        PromotionStatus status,

        LocalDate startsOn,
        LocalDate endsOn
) {
}
