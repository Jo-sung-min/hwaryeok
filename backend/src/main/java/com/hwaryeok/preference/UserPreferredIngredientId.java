package com.hwaryeok.preference;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class UserPreferredIngredientId implements Serializable {

    @Column(name = "user_id", length = 36)
    private String userId;

    @Column(name = "ingredient_id", length = 64)
    private String ingredientId;

    protected UserPreferredIngredientId() {
    }

    public UserPreferredIngredientId(String userId, String ingredientId) {
        this.userId = userId;
        this.ingredientId = ingredientId;
    }

    public String getUserId() { return userId; }
    public String getIngredientId() { return ingredientId; }

    @Override
    public boolean equals(Object object) {
        if (this == object) return true;
        if (!(object instanceof UserPreferredIngredientId other)) return false;
        return Objects.equals(userId, other.userId) && Objects.equals(ingredientId, other.ingredientId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, ingredientId);
    }
}
