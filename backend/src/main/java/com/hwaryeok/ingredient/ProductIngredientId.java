package com.hwaryeok.ingredient;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class ProductIngredientId implements Serializable {

    @Column(name = "product_id", length = 64)
    private String productId;

    @Column(name = "ingredient_id", length = 64)
    private String ingredientId;

    protected ProductIngredientId() {
    }

    public ProductIngredientId(String productId, String ingredientId) {
        this.productId = productId;
        this.ingredientId = ingredientId;
    }

    public String getProductId() { return productId; }
    public String getIngredientId() { return ingredientId; }

    @Override
    public boolean equals(Object object) {
        if (this == object) return true;
        if (!(object instanceof ProductIngredientId other)) return false;
        return Objects.equals(productId, other.productId) && Objects.equals(ingredientId, other.ingredientId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(productId, ingredientId);
    }
}
