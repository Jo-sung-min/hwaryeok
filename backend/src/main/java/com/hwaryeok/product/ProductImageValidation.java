package com.hwaryeok.product;

import java.util.Locale;

import org.springframework.util.StringUtils;

final class ProductImageValidation {

    static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;

    private ProductImageValidation() {
    }

    static String validateMetadata(String fileName, String contentType, long size) {
        if (!StringUtils.hasText(fileName)) {
            throw new IllegalArgumentException("이미지 파일 이름을 확인해 주세요.");
        }
        String cleanedName = cleanOriginalName(fileName);
        if (cleanedName.length() > 255 || cleanedName.indexOf('\u0000') >= 0) {
            throw new IllegalArgumentException("이미지 파일 이름을 확인해 주세요.");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("등록할 제품 이미지가 비어 있어요.");
        }
        if (size > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("제품 이미지는 5MB 이하만 등록할 수 있어요.");
        }

        String normalizedContentType = normalizeContentType(contentType);
        String lowerName = cleanedName.toLowerCase(Locale.ROOT);
        boolean extensionMatches = switch (normalizedContentType) {
            case "image/png" -> lowerName.endsWith(".png");
            case "image/jpeg" -> lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg");
            case "image/webp" -> lowerName.endsWith(".webp");
            default -> false;
        };
        if (!extensionMatches) {
            throw new IllegalArgumentException("파일 확장자와 이미지 형식이 일치하지 않아요.");
        }
        return normalizedContentType;
    }

    static String normalizeContentType(String contentType) {
        if (contentType == null) {
            throw unsupportedType();
        }
        return switch (contentType.strip().toLowerCase(Locale.ROOT)) {
            case "image/png" -> "image/png";
            case "image/jpeg" -> "image/jpeg";
            case "image/webp" -> "image/webp";
            default -> throw unsupportedType();
        };
    }

    static String detectContentType(byte[] data) {
        if (data == null) {
            throw unsupportedType();
        }
        if (data.length >= 8
                && (data[0] & 0xff) == 0x89 && data[1] == 0x50 && data[2] == 0x4e && data[3] == 0x47
                && data[4] == 0x0d && data[5] == 0x0a && data[6] == 0x1a && data[7] == 0x0a) {
            return "image/png";
        }
        if (data.length >= 3
                && (data[0] & 0xff) == 0xff && (data[1] & 0xff) == 0xd8 && (data[2] & 0xff) == 0xff) {
            return "image/jpeg";
        }
        if (data.length >= 12
                && data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
                && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P') {
            return "image/webp";
        }
        throw unsupportedType();
    }

    static String extensionFor(String contentType) {
        return switch (normalizeContentType(contentType)) {
            case "image/png" -> "png";
            case "image/jpeg" -> "jpg";
            case "image/webp" -> "webp";
            default -> throw unsupportedType();
        };
    }

    static String contentTypeForExtension(String extension) {
        return switch (extension) {
            case "png" -> "image/png";
            case "jpg" -> "image/jpeg";
            case "webp" -> "image/webp";
            default -> throw unsupportedType();
        };
    }

    static String cleanOriginalName(String originalName) {
        String cleaned = StringUtils.cleanPath(originalName == null ? "product-image" : originalName);
        int lastSlash = Math.max(cleaned.lastIndexOf('/'), cleaned.lastIndexOf('\\'));
        String fileName = lastSlash >= 0 ? cleaned.substring(lastSlash + 1) : cleaned;
        if (fileName.isBlank()) fileName = "product-image";
        return fileName.length() > 255 ? fileName.substring(fileName.length() - 255) : fileName;
    }

    private static IllegalArgumentException unsupportedType() {
        return new IllegalArgumentException("PNG, JPG, WEBP 형식의 실제 이미지 파일만 등록할 수 있어요.");
    }
}
