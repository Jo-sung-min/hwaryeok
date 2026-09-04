package com.hwaryeok.promotion;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.hwaryeok.product.ProductResponse;
import com.hwaryeok.review.ProductReviewMetrics;

public record PromotionResponse(
        String id,
        ProductResponse product,
        int recommendationScore,
        String headline,
        String recommendationReason,
        String destinationUrl,
        boolean emergingBrand,
        PromotionStatus status,
        LocalDate startsOn,
        LocalDate endsOn,
        boolean currentlyVisible,
        BigDecimal userReviewScore,
        long userReviewCount,
        String disclosure,
        Instant createdAt,
        Instant updatedAt
) {
    static PromotionResponse from(
            ProductPromotion promotion,
            ProductResponse product,
            ProductReviewMetrics reviewMetrics,
            boolean currentlyVisible
    ) {
        return new PromotionResponse(
                promotion.getId(),
                product,
                promotion.getRecommendationScore(),
                promotion.getHeadline(),
                promotion.getRecommendationReason(),
                promotion.getDestinationUrl(),
                promotion.isEmergingBrand(),
                promotion.getStatus(),
                promotion.getStartsOn(),
                promotion.getEndsOn(),
                currentlyVisible,
                reviewMetrics.averageScore(),
                reviewMetrics.reviewCount(),
                "광고 · 관리자 추천점수",
                promotion.getCreatedAt(),
                promotion.getUpdatedAt()
        );
    }
}
