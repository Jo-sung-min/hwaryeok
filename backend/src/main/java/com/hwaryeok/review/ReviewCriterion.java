package com.hwaryeok.review;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "review_criteria")
class ReviewCriterion {

    @Id
    @Column(length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private ReviewTemplate template;

    @Column(length = 50, nullable = false)
    private String code;

    @Column(length = 80, nullable = false)
    private String name;

    @Column(length = 300, nullable = false)
    private String description;

    @Column(precision = 5, scale = 2, nullable = false)
    private BigDecimal weight;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "use_yn", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ReviewCriterion() {
    }

    String getId() { return id; }
    String getCode() { return code; }
    String getName() { return name; }
    String getDescription() { return description; }
    BigDecimal getWeight() { return weight; }
    int getDisplayOrder() { return displayOrder; }
}
