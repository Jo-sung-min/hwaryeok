package com.hwaryeok.review;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.hwaryeok.product.Product;
import com.hwaryeok.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "reviews")
class ProductReview {

    @Id
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private ReviewTemplate template;

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

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ProductReviewScore> scores = new ArrayList<>();

    protected ProductReview() {
    }

    ProductReview(
            String id,
            Product product,
            User user,
            ReviewTemplate template,
            BigDecimal totalScore,
            String content,
            String skinType,
            String usagePeriod,
            boolean repurchase,
            Instant now
    ) {
        this.id = id;
        this.product = product;
        this.user = user;
        this.template = template;
        this.totalScore = totalScore;
        this.content = content;
        this.skinType = skinType;
        this.usagePeriod = usagePeriod;
        this.repurchase = repurchase;
        this.createdAt = now;
        this.updatedAt = now;
    }

    void addScore(ProductReviewScore score) {
        scores.add(score);
    }

    String getId() { return id; }
    User getUser() { return user; }
    BigDecimal getTotalScore() { return totalScore; }
    String getContent() { return content; }
    String getSkinType() { return skinType; }
    String getUsagePeriod() { return usagePeriod; }
    boolean isRepurchase() { return repurchase; }
    Instant getCreatedAt() { return createdAt; }
    List<ProductReviewScore> getScores() { return scores; }
}
