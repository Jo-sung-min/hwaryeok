package com.hwaryeok.promotion;

import java.time.Instant;
import java.time.LocalDate;

import com.hwaryeok.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_promotions")
class ProductPromotion {

    @Id
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(name = "recommendation_score", nullable = false)
    private int recommendationScore;

    @Column(length = 100, nullable = false)
    private String headline;

    @Column(name = "recommendation_reason", length = 500, nullable = false)
    private String recommendationReason;

    @Column(name = "destination_url", length = 500, nullable = false)
    private String destinationUrl;

    @Column(name = "emerging_brand", nullable = false)
    private boolean emergingBrand;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private PromotionStatus status;

    @Column(name = "starts_on")
    private LocalDate startsOn;

    @Column(name = "ends_on")
    private LocalDate endsOn;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProductPromotion() {
    }

    ProductPromotion(
            String id,
            Product product,
            int recommendationScore,
            String headline,
            String recommendationReason,
            String destinationUrl,
            boolean emergingBrand,
            PromotionStatus status,
            LocalDate startsOn,
            LocalDate endsOn,
            Instant now
    ) {
        this.id = id;
        this.product = product;
        this.recommendationScore = recommendationScore;
        this.headline = headline;
        this.recommendationReason = recommendationReason;
        this.destinationUrl = destinationUrl;
        this.emergingBrand = emergingBrand;
        this.status = status;
        this.startsOn = startsOn;
        this.endsOn = endsOn;
        this.createdAt = now;
        this.updatedAt = now;
    }

    void update(
            int recommendationScore,
            String headline,
            String recommendationReason,
            String destinationUrl,
            boolean emergingBrand,
            PromotionStatus status,
            LocalDate startsOn,
            LocalDate endsOn,
            Instant now
    ) {
        this.recommendationScore = recommendationScore;
        this.headline = headline;
        this.recommendationReason = recommendationReason;
        this.destinationUrl = destinationUrl;
        this.emergingBrand = emergingBrand;
        this.status = status;
        this.startsOn = startsOn;
        this.endsOn = endsOn;
        this.updatedAt = now;
    }

    boolean isVisibleOn(LocalDate date) {
        return status == PromotionStatus.ACTIVE
                && (startsOn == null || !startsOn.isAfter(date))
                && (endsOn == null || !endsOn.isBefore(date));
    }

    String getId() { return id; }
    Product getProduct() { return product; }
    int getRecommendationScore() { return recommendationScore; }
    String getHeadline() { return headline; }
    String getRecommendationReason() { return recommendationReason; }
    String getDestinationUrl() { return destinationUrl; }
    boolean isEmergingBrand() { return emergingBrand; }
    PromotionStatus getStatus() { return status; }
    LocalDate getStartsOn() { return startsOn; }
    LocalDate getEndsOn() { return endsOn; }
    Instant getCreatedAt() { return createdAt; }
    Instant getUpdatedAt() { return updatedAt; }
}
