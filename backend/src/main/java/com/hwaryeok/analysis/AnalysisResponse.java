package com.hwaryeok.analysis;

import java.util.List;

public record AnalysisResponse(
        String productId,
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
