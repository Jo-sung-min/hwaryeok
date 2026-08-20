package com.hwaryeok.product;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @Column(length = 64, nullable = false)
    private String id;

    @Column(length = 80, nullable = false)
    private String brand;

    @Column(length = 140, nullable = false)
    private String name;

    @Column(length = 40, nullable = false)
    private String category;

    @Column(name = "base_score", nullable = false)
    private int baseScore;

    @Column(length = 80, nullable = false)
    private String benefit;

    @Column(name = "sub_benefit", length = 80, nullable = false)
    private String subBenefit;

    @Column(nullable = false)
    private int price;

    @Column(length = 20, nullable = false)
    private String tone;

    @Column(length = 80)
    private String tag;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "publication_status", length = 20, nullable = false)
    private ProductPublicationStatus publicationStatus;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "source_checked_at")
    private LocalDate sourceCheckedAt;

    protected Product() {
    }

    public Product(String id, String brand, String name, String category, int baseScore, String benefit,
                   String subBenefit, int price, String tone, String tag) {
        this(id, brand, name, category, baseScore, benefit, subBenefit, price, tone, tag, null);
    }

    public Product(String id, String brand, String name, String category, int baseScore, String benefit,
                   String subBenefit, int price, String tone, String tag, String imageUrl) {
        this(id, brand, name, category, baseScore, benefit, subBenefit, price, tone, tag, imageUrl,
                ProductPublicationStatus.PUBLISHED, null, null);
    }

    public Product(String id, String brand, String name, String category, int baseScore, String benefit,
                   String subBenefit, int price, String tone, String tag, String imageUrl,
                   ProductPublicationStatus publicationStatus, String sourceUrl, LocalDate sourceCheckedAt) {
        this.id = id;
        this.brand = brand;
        this.name = name;
        this.category = category;
        this.baseScore = baseScore;
        this.benefit = benefit;
        this.subBenefit = subBenefit;
        this.price = price;
        this.tone = tone;
        this.tag = tag;
        this.imageUrl = imageUrl;
        this.publicationStatus = publicationStatus;
        this.sourceUrl = sourceUrl;
        this.sourceCheckedAt = sourceCheckedAt;
    }

    public String getId() { return id; }
    public String getBrand() { return brand; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public int getBaseScore() { return baseScore; }
    public String getBenefit() { return benefit; }
    public String getSubBenefit() { return subBenefit; }
    public int getPrice() { return price; }
    public String getTone() { return tone; }
    public String getTag() { return tag; }
    public String getImageUrl() { return imageUrl; }
    public ProductPublicationStatus getPublicationStatus() { return publicationStatus; }
    public String getSourceUrl() { return sourceUrl; }
    public LocalDate getSourceCheckedAt() { return sourceCheckedAt; }

    public void updateImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void updateDetails(String brand, String name, String category, int baseScore, String benefit,
                              String subBenefit, int price, String tone, String tag,
                              ProductPublicationStatus publicationStatus, String sourceUrl,
                              LocalDate sourceCheckedAt) {
        this.brand = brand;
        this.name = name;
        this.category = category;
        this.baseScore = baseScore;
        this.benefit = benefit;
        this.subBenefit = subBenefit;
        this.price = price;
        this.tone = tone;
        this.tag = tag;
        this.publicationStatus = publicationStatus;
        this.sourceUrl = sourceUrl;
        this.sourceCheckedAt = sourceCheckedAt;
    }
}
