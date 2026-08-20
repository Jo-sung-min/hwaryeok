package com.hwaryeok.product;

import java.text.NumberFormat;
import java.time.LocalDate;
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
        LocalDate sourceCheckedAt
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
                product.getSourceCheckedAt()
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
