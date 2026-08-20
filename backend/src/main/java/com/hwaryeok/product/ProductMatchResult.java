package com.hwaryeok.product;

import java.util.List;
import java.util.Set;

public record ProductMatchResult(
        int score,
        int ingredientQualityScore,
        int compatibilityScore,
        int dataConfidenceScore,
        String confidenceLevel,
        List<String> reasons,
        List<String> cautions,
        int ingredientCount,
        Set<String> matchedConcerns
) {
    public ProductMatchResult {
        reasons = List.copyOf(reasons);
        cautions = List.copyOf(cautions);
        matchedConcerns = Set.copyOf(matchedConcerns);
    }
}
