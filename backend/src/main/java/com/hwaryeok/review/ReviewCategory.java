package com.hwaryeok.review;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_categories")
class ReviewCategory {

    @Id
    @Column(length = 40, nullable = false)
    private String id;

    @Column(length = 60, nullable = false)
    private String name;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "use_yn", nullable = false)
    private boolean active;

    protected ReviewCategory() {
    }

    String getId() { return id; }
    String getName() { return name; }
}
