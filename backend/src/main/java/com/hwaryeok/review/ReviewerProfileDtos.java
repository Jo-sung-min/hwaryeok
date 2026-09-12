package com.hwaryeok.review;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

final class ReviewerProfileDtos {

    private ReviewerProfileDtos() {
    }

    record UpdateRequest(
            @NotBlank(message = "활동명을 입력해 주세요.")
            String nickname,
            @NotNull(message = "소개 내용을 입력해 주세요.") JsonNode bioBlocks,
            @Size(max = 2048, message = "블로그 주소는 2,048자 이내로 입력해 주세요.") String blogUrl,
            @Size(max = 2048, message = "Instagram 주소는 2,048자 이내로 입력해 주세요.") String instagramUrl
    ) {
    }

    record EditorResponse(
            String userId,
            String nickname,
            String profileImageUrl,
            JsonNode bioBlocks,
            String blogUrl,
            String instagramUrl,
            Instant profileUpdatedAt
    ) {
    }

    record PublicResponse(
            String userId,
            String nickname,
            String profileImageUrl,
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
                    stats.profileImageUrl(),
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

    record ImageUploadUrlRequest(
            @NotBlank(message = "이미지 파일 이름을 입력해 주세요.")
            @Size(max = 255, message = "이미지 파일 이름은 255자 이하로 입력해 주세요.") String fileName,
            @NotBlank(message = "이미지 형식을 입력해 주세요.") String contentType,
            @Min(value = 1, message = "등록할 프로필 이미지가 비어 있어요.")
            @Max(value = 5L * 1024 * 1024, message = "프로필 이미지는 5MB 이하만 등록할 수 있어요.") long size
    ) {
    }

    record ImageUploadCompleteRequest(
            @NotBlank(message = "업로드한 이미지 경로를 입력해 주세요.")
            @Size(max = 1024, message = "업로드한 이미지 경로를 확인해 주세요.") String objectKey
    ) {
    }

    record ImageUploadUrlResponse(
            String uploadUrl,
            String objectKey,
            String imageUrl,
            java.util.Map<String, String> headers,
            Instant expiresAt
    ) {
    }
}
