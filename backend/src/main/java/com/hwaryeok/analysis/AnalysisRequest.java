package com.hwaryeok.analysis;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record AnalysisRequest(
        @NotBlank(message = "제품을 선택해주세요.") String productId,
        @NotBlank(message = "피부 타입을 선택해주세요.") String skinType,
        @NotEmpty(message = "피부 고민을 하나 이상 선택해주세요.")
        @Size(max = 4, message = "피부 고민은 최대 4개까지 선택할 수 있어요.")
        List<@NotBlank String> concerns,
        String hydrationLevel,
        String oilinessLevel,
        String sensitivityLevel,
        String breakoutFrequency,
        String cleansingTightness,
        String rednessFrequency,
        String poreLevel,
        String texturePreference,
        String routineComplexity,
        String sunscreenUsage,
        List<String> reactionTriggers,
        List<String> breakoutZones,
        List<String> environments,
        List<String> routineContexts
) {
    public AnalysisRequest(String productId, String skinType, List<String> concerns) {
        this(productId, skinType, concerns, null, null, null, null, null, null, null, null, null, null, List.of(), List.of(), List.of(), List.of());
    }

    public AnalysisRequest(
            String productId, String skinType, List<String> concerns,
            String hydrationLevel, String oilinessLevel, String sensitivityLevel, String breakoutFrequency,
            String cleansingTightness, String rednessFrequency, String poreLevel, String texturePreference,
            String routineComplexity, String sunscreenUsage, List<String> reactionTriggers, List<String> environments
    ) {
        this(productId, skinType, concerns, hydrationLevel, oilinessLevel, sensitivityLevel, breakoutFrequency,
                cleansingTightness, rednessFrequency, poreLevel, texturePreference, routineComplexity,
                sunscreenUsage, reactionTriggers, List.of(), environments, List.of());
    }
}
