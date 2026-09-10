package com.hwaryeok.review;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

final class ReviewerProfileDtos {

    private ReviewerProfileDtos() {
    }

    record UpdateRequest(
            @NotNull(message = "소개 내용을 입력해 주세요.") JsonNode bioBlocks,
            @Size(max = 2048, message = "블로그 주소는 2,048자 이내로 입력해 주세요.") String blogUrl,
            @Size(max = 2048, message = "Instagram 주소는 2,048자 이내로 입력해 주세요.") String instagramUrl
    ) {
    }

    record EditorResponse(
            String userId,
            String nickname,
            JsonNode bioBlocks,
            String blogUrl,
            String instagramUrl,
            Instant profileUpdatedAt
    ) {
    }

    record PublicResponse(
            String userId,
            String nickname,
            String skinType,
            BigDecimal reviewFirepower,
            BigDecimal averageReceivedRating,
            long receivedRatingCount,
            long uniqueRaterCount,
            long reviewCount,
            BigDecimal averageReviewScore,
            Integer rank,
            JsonNode bioBlocks,
            String blogUrl,
            String instagramUrl,
            Instant profileUpdatedAt
    ) {
        static PublicResponse from(ReviewerProfileResponse stats, Presentation presentation) {
            return new PublicResponse(
                    stats.userId(),
                    stats.nickname(),
                    stats.skinType(),
                    stats.reviewFirepower(),
                    stats.averageReceivedRating(),
                    stats.receivedRatingCount(),
                    stats.uniqueRaterCount(),
                    stats.reviewCount(),
                    stats.averageReviewScore(),
                    stats.rank(),
                    presentation.bioBlocks(),
                    presentation.blogUrl(),
                    presentation.instagramUrl(),
                    presentation.updatedAt()
            );
        }
    }

    record Presentation(
            JsonNode bioBlocks,
            String blogUrl,
            String instagramUrl,
            Instant updatedAt
    ) {
    }
}
