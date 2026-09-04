package com.hwaryeok.review;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.hwaryeok.product.Product;
import com.hwaryeok.user.User;

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
        String authorId,
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
                review.getUser().getId(),
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
        int displayOrder,
        BigDecimal averageScore,
        long reviewCount
) {
}

record ReviewerResponse(
        String id,
        String nickname
) {
    static ReviewerResponse from(User user) {
        return new ReviewerResponse(user.getId(), user.getNickname());
    }
}

record ReviewedProductResponse(
        String id,
        String brand,
        String name,
        String category,
        String tone,
        String imageUrl
) {
    static ReviewedProductResponse from(Product product) {
        return new ReviewedProductResponse(
                product.getId(),
                product.getBrand(),
                product.getName(),
                product.getCategory(),
                product.getTone(),
                product.getImageUrl()
        );
    }
}

record ReviewerReviewResponse(
        String id,
        ReviewedProductResponse product,
        BigDecimal totalScore,
        String content,
        String skinType,
        String usagePeriod,
        boolean repurchaseYn,
        Instant createdAt
) {
    static ReviewerReviewResponse from(ProductReview review) {
        return new ReviewerReviewResponse(
                review.getId(),
                ReviewedProductResponse.from(review.getProduct()),
                review.getTotalScore(),
                review.getContent(),
                review.getSkinType(),
                review.getUsagePeriod(),
                review.isRepurchase(),
                review.getCreatedAt()
        );
    }
}

record ReviewerReviewListResponse(
        ReviewerResponse reviewer,
        BigDecimal averageReviewScore,
        long reviewCount,
        List<ReviewerReviewResponse> content,
        int page,
        int size,
        int totalPages,
        boolean hasNext
) {
}

record ProductReviewSummaryResponse(
        String productId,
        String categoryId,
        String categoryName,
        String templateId,
        int templateVersion,
        BigDecimal reviewScore,
        long reviewCount,
        boolean viewerHasReviewed,
        String rankingStatus,
        int minimumOfficialReviewCount,
        List<ReviewCriterionAverageResponse> criteriaAverages,
        List<ReviewDetailResponse> reviews
) {
}
