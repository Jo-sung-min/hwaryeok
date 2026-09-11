package com.hwaryeok.review;

import java.math.BigDecimal;
import java.time.Instant;

import com.hwaryeok.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_sample_reviews")
class ProductSampleReview {

    @Id
    @Column(length = 80, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(name = "total_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal totalScore;

    @Column(length = 2000, nullable = false)
    private String content;

    @Column(name = "skin_type", length = 40, nullable = false)
    private String skinType;

    @Column(name = "usage_period", length = 30, nullable = false)
    private String usagePeriod;

    @Column(name = "repurchase_yn", nullable = false)
    private boolean repurchase;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProductSampleReview() {
    }

    ProductSampleReview(
            String id,
            Product product,
            BigDecimal totalScore,
            String content,
            String skinType,
            String usagePeriod,
            boolean repurchase,
            Instant now
    ) {
        this.id = id;
        this.product = product;
        this.totalScore = totalScore;
        this.content = content;
        this.skinType = skinType;
        this.usagePeriod = usagePeriod;
        this.repurchase = repurchase;
        this.createdAt = now;
        this.updatedAt = now;
    }

    String getId() { return id; }
    BigDecimal getTotalScore() { return totalScore; }
    String getContent() { return content; }
    String getSkinType() { return skinType; }
    String getUsagePeriod() { return usagePeriod; }
    boolean isRepurchase() { return repurchase; }
    Instant getCreatedAt() { return createdAt; }
}
