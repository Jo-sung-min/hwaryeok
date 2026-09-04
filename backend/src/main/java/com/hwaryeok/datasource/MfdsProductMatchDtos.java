package com.hwaryeok.datasource;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

record MfdsProductCandidateResponse(
        String reportId,
        String productName,
        String companyName,
        String manufacturerName,
        String reportBasis,
        LocalDate reportDate,
        int confidence,
        List<String> matchReasons,
        boolean currentlyMatched
) {
}

record MfdsProductMatchRequest(
        String reportId,
        String reviewNote
) {
}

record MfdsProductNoMatchRequest(
        String reviewNote
) {
}

record AdminMfdsProductMatchResponse(
        String productId,
        String matchStatus,
        String reportId,
        String productName,
        String companyName,
        String manufacturerName,
        String reportBasis,
        LocalDate reportDate,
        int confidence,
        String reviewerNickname,
        Instant reviewedAt,
        String reviewNote
) {
}

record ProductRegulatorySourceResponse(
        boolean matched,
        String productId,
        String label,
        String reportId,
        String productName,
        String companyName,
        String manufacturerName,
        String reportBasis,
        LocalDate reportDate,
        Instant checkedAt,
        String sourceUrl,
        String disclaimer
) {
    static ProductRegulatorySourceResponse unmatched(String productId) {
        return new ProductRegulatorySourceResponse(
                false,
                productId,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }
}
