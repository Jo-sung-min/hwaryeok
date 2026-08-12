package com.hwaryeok.analysis;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record AnalysisRequest(
        @NotBlank(message = "제품을 선택해주세요.") String productId,
        @NotBlank(message = "피부 타입을 선택해주세요.") String skinType,
        @NotEmpty(message = "피부 고민을 하나 이상 선택해주세요.")
        @Size(max = 4, message = "피부 고민은 최대 4개까지 선택할 수 있어요.")
        List<@NotBlank String> concerns
) {
}
