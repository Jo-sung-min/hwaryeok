package com.hwaryeok.product;

import java.time.Instant;
import java.util.Map;

public record ProductImageUploadUrlResponse(
        String uploadUrl,
        String objectKey,
        String imageUrl,
        Map<String, String> headers,
        Instant expiresAt
) {
}
