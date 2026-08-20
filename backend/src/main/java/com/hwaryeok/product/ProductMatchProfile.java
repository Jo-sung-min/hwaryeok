package com.hwaryeok.product;

import java.util.List;

public record ProductMatchProfile(
        String skinType,
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
        List<String> concerns,
        List<String> reactionTriggers,
        List<String> breakoutZones,
        List<String> environments,
        List<String> routineContexts
) {
    public ProductMatchProfile {
        concerns = safe(concerns);
        reactionTriggers = safe(reactionTriggers);
        breakoutZones = safe(breakoutZones);
        environments = safe(environments);
        routineContexts = safe(routineContexts);
    }

    public static ProductMatchProfile neutral() {
        return new ProductMatchProfile(
                null, null, null, null, null, null, null, null, null, null, null,
                List.of(), List.of(), List.of(), List.of(), List.of()
        );
    }

    private static List<String> safe(List<String> values) {
        return values == null ? List.of() : List.copyOf(values);
    }
}
