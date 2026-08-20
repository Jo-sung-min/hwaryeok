package com.hwaryeok.comparison;

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
@Table(name = "user_comparison_products")
public class UserComparisonProduct {

    @EmbeddedId
    private UserComparisonProductId id;

    @MapsId("productId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "saved_at", nullable = false)
    private Instant savedAt;

    protected UserComparisonProduct() {
    }

    public UserComparisonProduct(String userId, Product product, int displayOrder, Instant savedAt) {
        this.id = new UserComparisonProductId(userId, product.getId());
        this.product = product;
        this.displayOrder = displayOrder;
        this.savedAt = savedAt;
    }

    public Product getProduct() {
        return product;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public Instant getSavedAt() {
        return savedAt;
    }
}
