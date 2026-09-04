package com.hwaryeok.datasource;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

record DataPipelineStatusResponse(
        List<DataSourceStatusResponse> sources,
        long ingredientReferenceCount,
        long mfdsProductCount,
        long mfdsRegulationCount,
        long officialIngredientListCount,
        long verifiedOfficialIngredientListCount
) {
}

record DataSourceStatusResponse(
        String id,
        String displayName,
        String sourceUrl,
        String termsUrl,
        String ingestionMode,
        String usageNote,
        boolean configured,
        long recordCount,
        String lastRunStatus,
        Instant lastRunAt
) {
}

record DataImportResultResponse(
        String sourceId,
        String status,
        int recordsRead,
        int recordsUpserted,
        int recordsSkipped,
        String message
) {
}

record MfdsSyncResponse(
        List<DataImportResultResponse> results
) {
}

record OfficialIngredientListRequest(
        String sourceUrl,
        String pageTitle,
        LocalDate checkedAt,
        String ingredientText,
        boolean officialSourceConfirmed
) {
}

record OfficialIngredientListResponse(
        String productId,
        String sourceUrl,
        String sourceDomain,
        String pageTitle,
        String ingredientText,
        LocalDate checkedAt,
        int totalIngredientCount,
        int matchedIngredientCount,
        List<String> unmatchedIngredients,
        String verificationStatus,
        boolean published
) {
}

record KciaIngredientRow(
        String sourceIngredientId,
        String standardName,
        String englishName,
        String casNo,
        String formerName
) {
}
