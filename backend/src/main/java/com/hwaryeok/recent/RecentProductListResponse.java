package com.hwaryeok.recent;

import java.util.List;

public record RecentProductListResponse(
        List<RecentProductItemResponse> content,
        long totalElements
) {
    public static RecentProductListResponse from(List<UserRecentProduct> recentProducts, long totalElements) {
        return new RecentProductListResponse(
                recentProducts.stream().map(RecentProductItemResponse::from).toList(),
                totalElements
        );
    }
}
