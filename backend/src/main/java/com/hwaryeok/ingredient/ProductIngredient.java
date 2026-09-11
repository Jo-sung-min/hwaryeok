package com.hwaryeok.ingredient;

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
@Table(name = "product_ingredients")
public class ProductIngredient {

    @EmbeddedId
    private ProductIngredientId id;

    @MapsId("productId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @MapsId("ingredientId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "concentration_note", length = 100)
    private String concentrationNote;

    @Column(name = "is_key_ingredient", nullable = false)
    private boolean keyIngredient;

    protected ProductIngredient() {
    }

    public ProductIngredient(Product product, Ingredient ingredient, int displayOrder, String concentrationNote) {
        this(product, ingredient, displayOrder, concentrationNote, false);
    }

    public ProductIngredient(Product product, Ingredient ingredient, int displayOrder, String concentrationNote,
                             boolean keyIngredient) {
        this.id = new ProductIngredientId(product.getId(), ingredient.getId());
        this.product = product;
        this.ingredient = ingredient;
        this.displayOrder = displayOrder;
        this.concentrationNote = concentrationNote;
        this.keyIngredient = keyIngredient;
    }

    public void updateDetails(int displayOrder, String concentrationNote, boolean keyIngredient) {
        this.displayOrder = displayOrder;
        this.concentrationNote = concentrationNote;
        this.keyIngredient = keyIngredient;
    }

    public Product getProduct() { return product; }
    public Ingredient getIngredient() { return ingredient; }
    public int getDisplayOrder() { return displayOrder; }
    public String getConcentrationNote() { return concentrationNote; }
    public boolean isKeyIngredient() { return keyIngredient; }
}
