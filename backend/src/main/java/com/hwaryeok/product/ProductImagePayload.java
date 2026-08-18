package com.hwaryeok.product;

public record ProductImagePayload(
        String originalName,
        String contentType,
        byte[] data
) {
}
