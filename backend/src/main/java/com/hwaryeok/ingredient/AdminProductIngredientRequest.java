package com.hwaryeok.ingredient;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminProductIngredientRequest(
        @NotNull(message = "성분 목록을 보내 주세요.")
        @Size(max = 100, message = "제품에는 성분을 최대 100개까지 연결할 수 있어요.")
        List<@Valid Item> ingredients
) {
    public record Item(
            @NotBlank(message = "성분을 선택해 주세요.")
            @Size(max = 64, message = "성분 ID는 64자 이하여야 해요.")
            String ingredientId,

            @Size(max = 100, message = "성분 메모는 100자 이하여야 해요.")
            String concentrationNote
    ) {
    }
}
