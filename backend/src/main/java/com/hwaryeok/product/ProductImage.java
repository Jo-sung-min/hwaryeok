package com.hwaryeok.product;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_images")
public class ProductImage {

    @Id
    @Column(name = "product_id", length = 64, nullable = false)
    private String productId;

    @Column(name = "original_name", length = 255, nullable = false)
    private String originalName;

    @Column(name = "content_type", length = 40, nullable = false)
    private String contentType;

    @Column(name = "image_data", nullable = false, columnDefinition = "BYTEA")
    private byte[] imageData;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProductImage() {
    }

    public ProductImage(String productId, String originalName, String contentType, byte[] imageData, Instant updatedAt) {
        this.productId = productId;
        this.originalName = originalName;
        this.contentType = contentType;
        this.imageData = imageData;
        this.updatedAt = updatedAt;
    }

    public String getProductId() { return productId; }
    public String getOriginalName() { return originalName; }
    public String getContentType() { return contentType; }
    public byte[] getImageData() { return imageData; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void replace(String originalName, String contentType, byte[] imageData, Instant updatedAt) {
        this.originalName = originalName;
        this.contentType = contentType;
        this.imageData = imageData;
        this.updatedAt = updatedAt;
    }
}
