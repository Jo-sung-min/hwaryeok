package com.hwaryeok.ingredient;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "ingredients")
public class Ingredient {

    @Id
    @Column(length = 64, nullable = false)
    private String id;

    @Column(length = 120, nullable = false, unique = true)
    private String name;

    @Column(name = "english_name", length = 160, nullable = false)
    private String englishName;

    @Column(length = 120, nullable = false)
    private String role;

    @Column(length = 1000, nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private IngredientStatus status;

    @Column(length = 600)
    private String caution;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "ingredient_tags", joinColumns = @JoinColumn(name = "ingredient_id"))
    @Column(name = "tag", length = 40, nullable = false)
    @OrderBy("tag ASC")
    private Set<String> tags = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "ingredient_skin_type_features", joinColumns = @JoinColumn(name = "ingredient_id"))
    @MapKeyColumn(name = "skin_type", length = 40)
    @Column(name = "feature", length = 600, nullable = false)
    private Map<String, String> skinTypeFeatures = new LinkedHashMap<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "ingredient_concern_features", joinColumns = @JoinColumn(name = "ingredient_id"))
    @MapKeyColumn(name = "concern", length = 40)
    @Column(name = "feature", length = 600, nullable = false)
    private Map<String, String> concernFeatures = new LinkedHashMap<>();

    protected Ingredient() {
    }

    public Ingredient(String id, String name, String englishName, String role, String description,
                      IngredientStatus status, String caution) {
        this.id = id;
        this.name = name;
        this.englishName = englishName;
        this.role = role;
        this.description = description;
        this.status = status;
        this.caution = caution;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEnglishName() { return englishName; }
    public String getRole() { return role; }
    public String getDescription() { return description; }
    public IngredientStatus getStatus() { return status; }
    public String getCaution() { return caution; }
    public Set<String> getTags() { return tags; }
    public Map<String, String> getSkinTypeFeatures() { return skinTypeFeatures; }
    public Map<String, String> getConcernFeatures() { return concernFeatures; }
}
