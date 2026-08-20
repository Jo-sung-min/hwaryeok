package com.hwaryeok.product;

import java.text.NumberFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

public record ProductResponse(
        String id,
        String brand,
        String name,
        String category,
        int grade,
        int score,
        String benefit,
        String subBenefit,
        int priceValue,
        String price,
        String tone,
        String tag,
        String imageUrl,
        ProductPublicationStatus publicationStatus,
        String sourceUrl,
        LocalDate sourceCheckedAt,
        int ingredientScore,
        int compatibilityScore,
        int dataConfidenceScore,
        String confidenceLevel,
        String scoreBasis,
        List<String> matchReasons,
        List<String> cautions,
        int ingredientCount
) {
    public static ProductResponse from(Product product) {
        int score = product.getBaseScore();
        return new ProductResponse(
                product.getId(),
                product.getBrand(),
                product.getName(),
                product.getCategory(),
                gradeFor(score),
                score,
                product.getBenefit(),
                product.getSubBenefit(),
                product.getPrice(),
                product.getPrice() > 0
                        ? NumberFormat.getNumberInstance(Locale.KOREA).format(product.getPrice()) + "원"
                        : "가격 정보 없음",
                product.getTone(),
                product.getTag(),
                product.getImageUrl(),
                product.getPublicationStatus(),
                product.getSourceUrl(),
                product.getSourceCheckedAt(),
                score,
                score,
                0,
                "LEGACY",
                "관리자 등록 기본 점수",
                List.of(),
                List.of(),
                0
        );
    }

    public static ProductResponse from(Product product, ProductMatchResult match, String scoreBasis) {
        int score = match.score();
        return new ProductResponse(
                product.getId(),
                product.getBrand(),
                product.getName(),
                product.getCategory(),
                gradeFor(score),
                score,
                product.getBenefit(),
                product.getSubBenefit(),
                product.getPrice(),
                product.getPrice() > 0
                        ? NumberFormat.getNumberInstance(Locale.KOREA).format(product.getPrice()) + "원"
                        : "가격 정보 없음",
                product.getTone(),
                product.getTag(),
                product.getImageUrl(),
                product.getPublicationStatus(),
                product.getSourceUrl(),
                product.getSourceCheckedAt(),
                match.ingredientQualityScore(),
                match.compatibilityScore(),
                match.dataConfidenceScore(),
                match.confidenceLevel(),
                scoreBasis,
                match.reasons(),
                match.cautions(),
                match.ingredientCount()
        );
    }

    public static int gradeFor(int score) {
        if (score >= 90) return 1;
        if (score >= 80) return 2;
        if (score >= 65) return 3;
        if (score >= 50) return 4;
        return 5;
    }
}
