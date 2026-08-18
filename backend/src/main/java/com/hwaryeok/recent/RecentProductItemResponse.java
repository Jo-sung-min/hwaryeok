package com.hwaryeok.recent;

import java.time.Instant;

import com.hwaryeok.product.ProductResponse;

public record RecentProductItemResponse(
        ProductResponse product,
        Instant viewedAt
) {
    public static RecentProductItemResponse from(UserRecentProduct recentProduct) {
        return new RecentProductItemResponse(
                ProductResponse.from(recentProduct.getProduct()),
                recentProduct.getViewedAt()
        );
    }
}
