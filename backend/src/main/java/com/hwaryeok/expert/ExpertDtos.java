package com.hwaryeok.expert;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

record ExpertTopicResponse(String code, String name) {}

record ExpertWorkplaceResponse(
        String hospitalName,
        String region,
        String address,
        String phone,
        String homepageUrl,
        boolean verified
) {}

record ExpertStatsResponse(
        int answerCount,
        int helpfulCount,
        int saveCount,
        int adoptedCount
) {}

record ExpertSummaryResponse(
        String id,
        String slug,
        String realName,
        String verificationLabel,
        boolean doctorVerified,
        boolean specialistVerified,
        String specialty,
        boolean workplaceVerified,
        String profileImageUrl,
        String bio,
        List<ExpertTopicResponse> topics,
        ExpertWorkplaceResponse workplace,
        ExpertStatsResponse stats
) {}

record ExpertAnswerResponse(
        String id,
        ExpertSummaryResponse expert,
        String content,
        int helpfulCount,
        int saveCount,
        boolean adopted,
        boolean viewerHelpful,
        boolean viewerSaved,
        Instant createdAt
) {}

record ExpertDetailResponse(
        ExpertSummaryResponse expert,
        List<ExpertAnswerResponse> recentAnswers
) {}

record ExpertQuestionListItemResponse(
        String id,
        String authorNickname,
        String title,
        String skinType,
        String ingredientId,
        String ingredientName,
        String status,
        int answerCount,
        Instant createdAt
) {}

record ExpertQuestionDetailResponse(
        String id,
        String authorNickname,
        String title,
        String content,
        String skinType,
        String ingredientId,
        String ingredientName,
        String status,
        boolean viewerIsAuthor,
        Instant createdAt,
        List<ExpertAnswerResponse> answers
) {}

record ExpertRankingItemResponse(
        int rank,
        ExpertSummaryResponse expert,
        int activityScore,
        ExpertStatsResponse periodStats
) {}

record ExpertRankingResponse(
        String period,
        String topic,
        String disclaimer,
        List<ExpertRankingItemResponse> content
) {}

record ExpertQuestionRequest(
        @NotBlank @Size(max = 160) String title,
        @NotBlank @Size(min = 10, max = 3000) String content,
        @Size(max = 40) String skinType,
        @Size(max = 64) String ingredientId
) {}

record ExpertAnswerRequest(@NotBlank @Size(min = 20, max = 4000) String content) {}

record ExpertWorkplaceRequest(
        @NotBlank @Size(max = 160) String hospitalName,
        @NotBlank @Size(max = 80) String region,
        @NotBlank @Size(max = 300) String address,
        @Size(max = 30) String phone,
        @Size(max = 500)
        @Pattern(regexp = "https?://[^\\s]+", message = "홈페이지 주소는 http:// 또는 https://로 시작해야 해요.")
        String homepageUrl
) {}

record ExpertApplicationRequest(
        @NotBlank @Size(max = 80) String realName,
        @NotBlank @Size(min = 4, max = 40) String licenseNumber,
        boolean specialistRequested,
        @Size(max = 100) String specialty,
        @NotEmpty @Size(max = 3) List<@Pattern(regexp = "BARRIER|ACNE|SENSITIVE|AGING|INGREDIENT") String> topics,
        @NotBlank @Size(max = 1000) String bio,
        @NotNull @Valid ExpertWorkplaceRequest workplace
) {}

record ExpertApplicationResponse(
        String id,
        String realName,
        String status,
        boolean specialistRequested,
        String specialty,
        List<ExpertTopicResponse> topics,
        ExpertWorkplaceResponse workplace,
        Instant createdAt,
        Instant updatedAt
) {}

record ExpertVerificationRequest(
        @NotBlank @Pattern(regexp = "VERIFIED|REJECTED") String status,
        boolean doctorVerified,
        boolean specialistVerified,
        boolean workplaceVerified
) {}

record ExpertEngagementResponse(
        String answerId,
        int helpfulCount,
        int saveCount,
        boolean viewerHelpful,
        boolean viewerSaved,
        boolean adopted
) {}
