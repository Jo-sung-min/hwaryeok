package com.hwaryeok.profile;

import java.time.Instant;
import java.util.List;

public record SkinProfileResponse(
        boolean configured,
        String skinType,
        List<String> concerns,
        Instant createdAt,
        Instant updatedAt
) {
    public static SkinProfileResponse empty() {
        return new SkinProfileResponse(false, null, List.of(), null, null);
    }
}
