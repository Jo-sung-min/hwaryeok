package com.hwaryeok.favorite;

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
@Table(name = "user_favorites")
public class UserFavorite {

    @EmbeddedId
    private UserFavoriteId id;

    @MapsId("productId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected UserFavorite() {
    }

    public UserFavorite(String userId, Product product, Instant createdAt) {
        this.id = new UserFavoriteId(userId, product.getId());
        this.product = product;
        this.createdAt = createdAt;
    }

    public UserFavoriteId getId() {
        return id;
    }

    public Product getProduct() {
        return product;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
