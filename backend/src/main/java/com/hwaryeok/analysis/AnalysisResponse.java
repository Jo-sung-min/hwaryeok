package com.hwaryeok.analysis;

import java.util.List;

import com.hwaryeok.product.ProductResponse;

public record AnalysisResponse(
        String productId,
        ProductResponse product,
        String skinType,
        List<String> concerns,
        int grade,
        int score,
        String verdict,
        List<String> highlights,
        List<String> cautions,
        List<ScoreDetail> details
) {
    public record ScoreDetail(String label, int value, String note, boolean positive) {
    }
}
