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
@Table(name = "review_templates")
class ReviewTemplate {

    @Id
    @Column(length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private ReviewCategory category;

    @Column(nullable = false)
    private int version;

    @Column(name = "use_yn", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ReviewTemplate() {
    }

    String getId() { return id; }
    ReviewCategory getCategory() { return category; }
    int getVersion() { return version; }
}
