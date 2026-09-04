package com.hwaryeok.product;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_retail_snapshots")
public class ProductRetailSnapshot {

    @Id
    @Column(name = "product_id", length = 64, nullable = false)
    private String productId;

    @Column(length = 40, nullable = false)
    private String retailer;

    @Column(name = "retailer_product_id", length = 80, nullable = false)
    private String retailerProductId;

    @Column(name = "retailer_product_name", length = 300, nullable = false)
    private String retailerProductName;

    @Column(name = "retailer_url", length = 500, nullable = false)
    private String retailerUrl;

    @Column(name = "package_info", length = 200, nullable = false)
    private String packageInfo;

    @Column(name = "regular_price", nullable = false)
    private int regularPrice;

    @Column(name = "sale_price")
    private Integer salePrice;

    @Column(length = 20, nullable = false)
    private String availability;

    @Column(name = "checked_at", nullable = false)
    private LocalDate checkedAt;

    @Column(name = "collected_at", nullable = false)
    private OffsetDateTime collectedAt;

    @Column(length = 300)
    private String notes;

    protected ProductRetailSnapshot() {
    }

    public ProductRetailSnapshot(
            String productId,
            String retailer,
            String retailerProductId,
            String retailerProductName,
            String retailerUrl,
            String packageInfo,
            int regularPrice,
            Integer salePrice,
            String availability,
            LocalDate checkedAt,
            OffsetDateTime collectedAt,
            String notes
    ) {
        this.productId = productId;
        this.retailer = retailer;
        this.retailerProductId = retailerProductId;
        this.retailerProductName = retailerProductName;
        this.retailerUrl = retailerUrl;
        this.packageInfo = packageInfo;
        this.regularPrice = regularPrice;
        this.salePrice = salePrice;
        this.availability = availability;
        this.checkedAt = checkedAt;
        this.collectedAt = collectedAt;
        this.notes = notes;
    }

    public String getProductId() { return productId; }
    public String getRetailer() { return retailer; }
    public String getRetailerProductId() { return retailerProductId; }
    public String getRetailerProductName() { return retailerProductName; }
    public String getRetailerUrl() { return retailerUrl; }
    public String getPackageInfo() { return packageInfo; }
    public int getRegularPrice() { return regularPrice; }
    public Integer getSalePrice() { return salePrice; }
    public String getAvailability() { return availability; }
    public LocalDate getCheckedAt() { return checkedAt; }
    public OffsetDateTime getCollectedAt() { return collectedAt; }
    public String getNotes() { return notes; }
}
