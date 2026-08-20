package com.hwaryeok.product;

import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminProductRequest(
        @NotBlank(message = "제품 ID를 입력해 주세요.")
        @Size(max = 64, message = "제품 ID는 64자 이하여야 해요.")
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "제품 ID는 영문 소문자, 숫자, 하이픈만 사용할 수 있어요.")
        String id,

        @NotBlank(message = "브랜드를 입력해 주세요.")
        @Size(max = 80, message = "브랜드는 80자 이하여야 해요.")
        String brand,

        @NotBlank(message = "제품명을 입력해 주세요.")
        @Size(max = 140, message = "제품명은 140자 이하여야 해요.")
        String name,

        @NotBlank(message = "카테고리를 입력해 주세요.")
        @Size(max = 40, message = "카테고리는 40자 이하여야 해요.")
        String category,

        @NotNull(message = "기본 화력점수를 입력해 주세요.")
        @Min(value = 0, message = "화력점수는 0 이상이어야 해요.")
        @Max(value = 100, message = "화력점수는 100 이하여야 해요.")
        Integer baseScore,

        @NotBlank(message = "핵심 기준을 입력해 주세요.")
        @Size(max = 80, message = "핵심 기준은 80자 이하여야 해요.")
        String benefit,

        @NotBlank(message = "보조 기준을 입력해 주세요.")
        @Size(max = 80, message = "보조 기준은 80자 이하여야 해요.")
        String subBenefit,

        @NotNull(message = "가격을 입력해 주세요.")
        @Min(value = 0, message = "가격은 0 이상이어야 해요.")
        Integer price,

        @NotBlank(message = "대표 색상을 선택해 주세요.")
        @Pattern(regexp = "^(peach|sage|sand|rose|blue)$", message = "지원하는 대표 색상을 선택해 주세요.")
        String tone,

        @Size(max = 80, message = "표시 문구는 80자 이하여야 해요.")
        String tag,

        @NotNull(message = "공개 상태를 선택해 주세요.")
        ProductPublicationStatus publicationStatus,

        @Size(max = 500, message = "출처 주소는 500자 이하여야 해요.")
        @Pattern(regexp = "^https?://\\S+$", message = "출처 주소는 http:// 또는 https://로 시작해야 해요.")
        String sourceUrl,

        @PastOrPresent(message = "출처 확인일은 오늘 또는 이전 날짜여야 해요.")
        LocalDate sourceCheckedAt
) {
    public Product toProduct() {
        return new Product(
                id.strip(), brand.strip(), name.strip(), category.strip(), baseScore,
                benefit.strip(), subBenefit.strip(), price, tone, normalizeOptional(tag), null,
                publicationStatus, normalizeOptional(sourceUrl), sourceCheckedAt
        );
    }

    private static String normalizeOptional(String value) {
        if (value == null || value.isBlank()) return null;
        return value.strip();
    }
}
