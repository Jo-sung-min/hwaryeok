package com.hwaryeok.ingredient;

import java.util.List;

import com.hwaryeok.profile.SkinProfileRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record IngredientRecommendationRequest(
        @NotNull(message = "피부 프로필을 입력해 주세요.")
        @Valid
        SkinProfileRequest profile,

        @NotNull(message = "선호 성분 목록을 입력해 주세요.")
        @Size(max = 10, message = "선호 성분은 최대 10개까지 입력할 수 있어요.")
        List<@NotBlank(message = "선호 성분 ID가 비어 있어요.")
                @Size(max = 64, message = "선호 성분 ID는 64자 이하여야 해요.") String> preferredIngredientIds,

        @Min(value = 1, message = "추천 성분 수는 1개 이상이어야 해요.")
        @Max(value = 6, message = "추천 성분 수는 6개 이하여야 해요.")
        Integer limit
) {
    public int resolvedLimit() {
        return limit == null ? 4 : limit;
    }
}
