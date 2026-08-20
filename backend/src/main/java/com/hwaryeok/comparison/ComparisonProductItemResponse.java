package com.hwaryeok.comparison;

import java.time.Instant;

import com.hwaryeok.product.ProductResponse;

public record ComparisonProductItemResponse(
        ProductResponse product,
        int displayOrder,
        Instant savedAt
) {
    public static ComparisonProductItemResponse from(UserComparisonProduct comparisonProduct) {
        return new ComparisonProductItemResponse(
                ProductResponse.from(comparisonProduct.getProduct()),
                comparisonProduct.getDisplayOrder(),
                comparisonProduct.getSavedAt()
        );
    }
}
