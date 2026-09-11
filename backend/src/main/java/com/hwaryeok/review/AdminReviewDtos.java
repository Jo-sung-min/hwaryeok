package com.hwaryeok.review;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class AdminReviewDtos {

    private AdminReviewDtos() {
    }

    public record ProductResponse(
            String id,
            String brand,
            String name,
            String category,
            String imageUrl,
            String publicationStatus
    ) {
    }

    public record AuthorResponse(
            String id,
            String nickname,
            String status
    ) {
    }

    public record ItemResponse(
            String id,
            String kind,
            boolean sampleReview,
            ProductResponse product,
            AuthorResponse author,
            BigDecimal totalScore,
            String content,
            String skinType,
            String usagePeriod,
            boolean repurchaseYn,
            BigDecimal communityAverageScore,
            long communityRatingCount,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record PageResponse(
            List<ItemResponse> content,
            int page,
            int size,
            long totalElements,
            long totalPages,
            boolean hasNext,
            String kind,
            String query
    ) {
    }
}
