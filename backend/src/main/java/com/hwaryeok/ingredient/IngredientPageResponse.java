package com.hwaryeok.ingredient;

import java.util.List;

import org.springframework.data.domain.Page;

public record IngredientPageResponse(
        List<IngredientResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext
) {
    public static IngredientPageResponse from(Page<Ingredient> result) {
        return new IngredientPageResponse(
                result.getContent().stream().map(IngredientResponse::from).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext()
        );
    }
}
