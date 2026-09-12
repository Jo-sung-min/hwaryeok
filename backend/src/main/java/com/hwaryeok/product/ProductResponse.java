package com.hwaryeok.product;

import java.math.BigDecimal;
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
        BigDecimal netContentValue,
        ProductNetContentUnit netContentUnit,
        String netContent,
        int priceValue,
        String price,
        String tone,
        String tag,
        String imageUrl,
        String coupangPartnersUrl,
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
        int ingredientCount,
        BigDecimal reviewScore,
        long reviewCount
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
                product.getNetContentValue(),
                product.getNetContentUnit(),
                netContent(product),
                product.getPrice(),
                product.getPrice() > 0
                        ? NumberFormat.getNumberInstance(Locale.KOREA).format(product.getPrice()) + "원"
                        : "가격 정보 없음",
                product.getTone(),
                product.getTag(),
                product.getImageUrl(),
                product.getCoupangPartnersUrl(),
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
                0,
                null,
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
                product.getNetContentValue(),
                product.getNetContentUnit(),
                netContent(product),
                product.getPrice(),
                product.getPrice() > 0
                        ? NumberFormat.getNumberInstance(Locale.KOREA).format(product.getPrice()) + "원"
                        : "가격 정보 없음",
                product.getTone(),
                product.getTag(),
                product.getImageUrl(),
                product.getCoupangPartnersUrl(),
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
                match.ingredientCount(),
                null,
                0
        );
    }

    public ProductResponse withReviewMetrics(BigDecimal reviewScore, long reviewCount) {
        return new ProductResponse(
                id, brand, name, category, grade, score, benefit, subBenefit,
                netContentValue, netContentUnit, netContent, priceValue, price, tone, tag,
                imageUrl, coupangPartnersUrl, publicationStatus, sourceUrl, sourceCheckedAt,
                ingredientScore, compatibilityScore, dataConfidenceScore, confidenceLevel,
                scoreBasis, matchReasons, cautions, ingredientCount, reviewScore, reviewCount
        );
    }

    public static int gradeFor(int score) {
        if (score >= 90) return 1;
        if (score >= 80) return 2;
        if (score >= 65) return 3;
        if (score >= 50) return 4;
        return 5;
    }

    private static String netContent(Product product) {
        if (product.getNetContentValue() == null || product.getNetContentUnit() == null) return null;
        String unit = product.getNetContentUnit() == ProductNetContentUnit.ML ? "mL" : "g";
        return product.getNetContentValue().stripTrailingZeros().toPlainString() + " " + unit;
    }
}
