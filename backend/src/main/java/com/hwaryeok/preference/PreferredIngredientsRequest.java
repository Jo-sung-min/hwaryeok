package com.hwaryeok.preference;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PreferredIngredientsRequest(
        @NotNull
        @Size(max = 10, message = "관심 성분은 최대 10개까지 선택할 수 있어요.")
        List<@NotBlank String> ingredientIds
) {
}
