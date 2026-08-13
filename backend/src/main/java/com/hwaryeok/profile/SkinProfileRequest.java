package com.hwaryeok.profile;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SkinProfileRequest(
        @NotBlank(message = "피부 타입을 선택해 주세요.")
        @Pattern(regexp = "건성|지성|복합성|수부지|중성|민감", message = "지원하지 않는 피부 타입이에요.")
        String skinType,

        @NotEmpty(message = "피부 고민을 하나 이상 선택해 주세요.")
        @Size(max = 4, message = "피부 고민은 최대 4개까지 선택할 수 있어요.")
        List<
                @NotBlank(message = "피부 고민 값이 비어 있어요.")
                @Pattern(regexp = "속건조|민감|모공|붉은기|피부 장벽|각질|칙칙함|탄력", message = "지원하지 않는 피부 고민이에요.")
                String
        > concerns
) {
}
