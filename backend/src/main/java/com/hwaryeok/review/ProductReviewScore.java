package com.hwaryeok.review;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "review_scores")
class ProductReviewScore {

    @Id
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "review_id", nullable = false)
    private ProductReview review;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criteria_id", nullable = false)
    private ReviewCriterion criterion;

    @Column(nullable = false)
    private int score;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ProductReviewScore() {
    }

    ProductReviewScore(String id, ProductReview review, ReviewCriterion criterion, int score, Instant createdAt) {
        this.id = id;
        this.review = review;
        this.criterion = criterion;
        this.score = score;
        this.createdAt = createdAt;
    }

    ReviewCriterion getCriterion() { return criterion; }
    int getScore() { return score; }
}
