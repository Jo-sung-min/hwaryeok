package com.hwaryeok.review;

import java.math.BigDecimal;

public record ProductReviewMetrics(
        BigDecimal averageScore,
        long reviewCount
) {
}
