package com.hwaryeok.profile;

import java.time.Instant;
import java.util.List;

public record SkinProfileResponse(
        boolean configured,
        String skinType,
        String hydrationLevel,
        String oilinessLevel,
        String sensitivityLevel,
        String breakoutFrequency,
        int profileVersion,
        String cleansingTightness,
        String rednessFrequency,
        String poreLevel,
        String texturePreference,
        String routineComplexity,
        String sunscreenUsage,
        List<String> reactionTriggers,
        List<String> breakoutZones,
        List<String> environments,
        List<String> concerns,
        Instant createdAt,
        Instant updatedAt
) {
    public static SkinProfileResponse empty() {
        return new SkinProfileResponse(false, null, null, null, null, null, 0, null, null, null, null, null, null, List.of(), List.of(), List.of(), List.of(), null, null);
    }
}
