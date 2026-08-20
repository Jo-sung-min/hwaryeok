package com.hwaryeok.comparison;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ComparisonProductsRequest(
        @NotNull(message = "비교할 제품을 선택해 주세요.")
        @Size(min = 2, max = 3, message = "비교 제품은 2개 또는 3개를 선택해 주세요.")
        List<@NotBlank(message = "제품 ID를 입력해 주세요.") @Pattern(
                regexp = "^[a-zA-Z0-9-]{1,64}$",
                message = "제품 ID 형식을 다시 확인해 주세요."
        ) String> productIds
) {
}
