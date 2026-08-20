package com.hwaryeok.comparison;

import java.util.List;

public record ComparisonProductListResponse(
        List<ComparisonProductItemResponse> content,
        int totalElements
) {
    public static ComparisonProductListResponse from(List<UserComparisonProduct> comparisonProducts) {
        List<ComparisonProductItemResponse> content = comparisonProducts.stream()
                .map(ComparisonProductItemResponse::from)
                .toList();
        return new ComparisonProductListResponse(content, content.size());
    }

    public static ComparisonProductListResponse empty() {
        return new ComparisonProductListResponse(List.of(), 0);
    }
}
