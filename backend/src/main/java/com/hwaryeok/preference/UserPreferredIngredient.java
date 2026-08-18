package com.hwaryeok.preference;

import java.time.Instant;

import com.hwaryeok.ingredient.Ingredient;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_preferred_ingredients")
public class UserPreferredIngredient {

    @EmbeddedId
    private UserPreferredIngredientId id;

    @MapsId("ingredientId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(nullable = false)
    private int priority;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected UserPreferredIngredient() {
    }

    public UserPreferredIngredient(String userId, Ingredient ingredient, int priority, Instant createdAt) {
        this.id = new UserPreferredIngredientId(userId, ingredient.getId());
        this.ingredient = ingredient;
        this.priority = priority;
        this.createdAt = createdAt;
    }

    public Ingredient getIngredient() { return ingredient; }
    public int getPriority() { return priority; }
    public Instant getCreatedAt() { return createdAt; }
}
