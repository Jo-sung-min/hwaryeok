package com.hwaryeok.recent;

import java.time.Instant;

import com.hwaryeok.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_recent_products")
public class UserRecentProduct {

    @EmbeddedId
    private UserRecentProductId id;

    @MapsId("productId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "viewed_at", nullable = false)
    private Instant viewedAt;

    protected UserRecentProduct() {
    }

    public UserRecentProduct(String userId, Product product, Instant viewedAt) {
        this.id = new UserRecentProductId(userId, product.getId());
        this.product = product;
        this.viewedAt = viewedAt;
    }

    public Product getProduct() {
        return product;
    }

    public Instant getViewedAt() {
        return viewedAt;
    }

    public void markViewed(Instant viewedAt) {
        this.viewedAt = viewedAt;
    }
}
