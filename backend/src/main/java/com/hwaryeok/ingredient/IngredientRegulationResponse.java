package com.hwaryeok.ingredient;

import java.time.Instant;

public record IngredientRegulationResponse(
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
        String sourceUrl,
        String disclaimer
) {
}
