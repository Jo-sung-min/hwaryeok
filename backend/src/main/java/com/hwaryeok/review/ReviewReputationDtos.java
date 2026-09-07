package com.hwaryeok.review;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

record ReviewFirepowerRequest(
        @NotNull(message = "리뷰 화력을 선택해 주세요.")
        @Min(value = 1, message = "리뷰 화력은 1점 이상이어야 해요.")
        @Max(value = 5, message = "리뷰 화력은 5점 이하여야 해요.") Integer score
) {}

record ReviewCommunityRatingResponse(
        BigDecimal averageScore,
        long ratingCount,
        Integer viewerScore,
        boolean canRate
) {}

record ReviewerProfileResponse(
        String userId,
        String nickname,
        String skinType,
        BigDecimal reviewFirepower,
        BigDecimal averageReceivedRating,
        long receivedRatingCount,
        long uniqueRaterCount,
        long reviewCount,
        BigDecimal averageReviewScore,
        Integer rank
) {
    ReviewerProfileResponse withRank(Integer value) {
        return new ReviewerProfileResponse(userId, nickname, skinType, reviewFirepower,
                averageReceivedRating, receivedRatingCount, uniqueRaterCount, reviewCount, averageReviewScore, value);
    }
}

record ReviewerRankingResponse(
        List<ReviewerProfileResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        String skinType
) {}
