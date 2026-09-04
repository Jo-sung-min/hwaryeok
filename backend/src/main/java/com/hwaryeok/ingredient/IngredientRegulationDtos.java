package com.hwaryeok.ingredient;

import java.time.Instant;
import java.util.List;

record IngredientRegulationCandidateResponse(
        String sourceRecordId,
        String standardName,
        String englishName,
        String casNo,
        String country,
        String noticeIngredientName,
        String restrictionType,
        String restrictionText,
        String proviso,
        Instant checkedAt,
        int confidence,
        List<String> matchReasons,
        boolean verified
) {
}

record AdminIngredientRegulationReviewResponse(
        String ingredientId,
        String sourceRecordId,
        String standardName,
        String englishName,
        String casNo,
        String country,
        String noticeIngredientName,
        String restrictionType,
        String restrictionText,
        String proviso,
        Instant checkedAt,
        String reviewerNickname,
        Instant reviewedAt,
        String reviewNote
) {
}

record IngredientRegulationReviewRequest(
        String reviewNote
) {
}
