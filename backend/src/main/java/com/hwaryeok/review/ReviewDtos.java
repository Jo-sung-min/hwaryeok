package com.hwaryeok.review;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

record ReviewCriterionResponse(
        String id,
        String code,
        String name,
        String description,
        int displayOrder
) {
    static ReviewCriterionResponse from(ReviewCriterion criterion) {
        return new ReviewCriterionResponse(
                criterion.getId(),
                criterion.getCode(),
                criterion.getName(),
                criterion.getDescription(),
                criterion.getDisplayOrder()
        );
    }
}

record ReviewCriteriaResponse(
        String categoryId,
        String categoryName,
        String templateId,
        int templateVersion,
        List<ReviewCriterionResponse> criteria
) {
}

record ReviewScoreRequest(
        @NotBlank(message = "평가 항목을 확인해 주세요.") String criteriaId,
        @NotNull(message = "평가 점수를 선택해 주세요.")
        @Min(value = 1, message = "평가 점수는 1점 이상이어야 해요.")
        @Max(value = 5, message = "평가 점수는 5점 이하여야 해요.") Integer score
) {
}

record CreateReviewRequest(
        @NotBlank(message = "리뷰 내용을 입력해 주세요.")
        @Size(min = 10, max = 2000, message = "리뷰는 10자 이상 2,000자 이하로 입력해 주세요.") String content,
        @NotBlank(message = "피부 타입을 선택해 주세요.") String skinType,
        @NotBlank(message = "사용 기간을 선택해 주세요.") String usagePeriod,
        @NotNull(message = "재구매 의향을 선택해 주세요.") Boolean repurchaseYn,
        @NotEmpty(message = "평가 점수를 선택해 주세요.") List<@Valid ReviewScoreRequest> scores
) {
}

record ReviewDetailResponse(
        String id,
        String authorNickname,
        BigDecimal totalScore,
        String content,
        String skinType,
        String usagePeriod,
        boolean repurchaseYn,
        Instant createdAt
) {
    static ReviewDetailResponse from(ProductReview review) {
        return new ReviewDetailResponse(
                review.getId(),
                review.getUser().getNickname(),
                review.getTotalScore(),
                review.getContent(),
                review.getSkinType(),
                review.getUsagePeriod(),
                review.isRepurchase(),
                review.getCreatedAt()
        );
    }
}

record ReviewCriterionAverageResponse(
        String criteriaId,
        String code,
        String name,
        String description,
        BigDecimal averageScore,
        long reviewCount
) {
}

record ProductReviewSummaryResponse(
        String productId,
        BigDecimal reviewScore,
        long reviewCount,
        String rankingStatus,
        int minimumOfficialReviewCount,
        List<ReviewCriterionAverageResponse> criteriaAverages,
        List<ReviewDetailResponse> reviews
) {
}
