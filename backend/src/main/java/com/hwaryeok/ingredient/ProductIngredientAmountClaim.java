package com.hwaryeok.ingredient;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_ingredient_amount_claims")
public class ProductIngredientAmountClaim {

    @EmbeddedId
    private ProductIngredientId id;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private IngredientAmountKind kind;

    @Column(name = "min_amount", precision = 24, scale = 12)
    private BigDecimal minAmount;

    @Column(name = "max_amount", precision = 24, scale = 12)
    private BigDecimal maxAmount;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private IngredientAmountUnit unit;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private IngredientAmountBasis basis;

    @Enumerated(EnumType.STRING)
    @Column(name = "substance_basis", length = 40, nullable = false)
    private IngredientSubstanceBasis substanceBasis;

    @Column(name = "raw_claim_text", length = 500, nullable = false)
    private String rawClaimText;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", length = 40, nullable = false)
    private IngredientAmountSourceType sourceType;

    @Column(name = "source_url", length = 500, nullable = false)
    private String sourceUrl;

    @Column(name = "page_title", length = 300, nullable = false)
    private String pageTitle;

    @Column(name = "source_ingredient_name", length = 300, nullable = false)
    private String sourceIngredientName;

    @Column(name = "checked_at", nullable = false)
    private LocalDate checkedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 20, nullable = false)
    private IngredientAmountVerificationStatus verificationStatus;

    @Column(name = "review_note", length = 500)
    private String reviewNote;

    @Column(name = "reviewed_by", length = 36)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    protected ProductIngredientAmountClaim() {
    }

    public ProductIngredientAmountClaim(String productId, String ingredientId) {
        this.id = new ProductIngredientId(productId, ingredientId);
    }

    public void update(
            IngredientAmountKind kind,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            IngredientAmountUnit unit,
            IngredientAmountBasis basis,
            IngredientSubstanceBasis substanceBasis,
            String rawClaimText,
            IngredientAmountSourceType sourceType,
            String sourceUrl,
            String pageTitle,
            String sourceIngredientName,
            LocalDate checkedAt,
            IngredientAmountVerificationStatus verificationStatus,
            String reviewNote,
            String reviewedBy,
            Instant reviewedAt
    ) {
        this.kind = kind;
        this.minAmount = minAmount;
        this.maxAmount = maxAmount;
        this.unit = unit;
        this.basis = basis;
        this.substanceBasis = substanceBasis;
        this.rawClaimText = rawClaimText;
        this.sourceType = sourceType;
        this.sourceUrl = sourceUrl;
        this.pageTitle = pageTitle;
        this.sourceIngredientName = sourceIngredientName;
        this.checkedAt = checkedAt;
        this.verificationStatus = verificationStatus;
        this.reviewNote = reviewNote;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = reviewedAt;
    }

    public void markStale(Instant staleAt) {
        this.verificationStatus = IngredientAmountVerificationStatus.STALE;
        this.reviewedAt = staleAt;
        String reason = "제품 성분 연결이 변경되어 재검수가 필요해요.";
        this.reviewNote = this.reviewNote == null || this.reviewNote.isBlank()
                ? reason
                : this.reviewNote + " · " + reason;
    }

    public ProductIngredientId getId() { return id; }
    public IngredientAmountKind getKind() { return kind; }
    public BigDecimal getMinAmount() { return minAmount; }
    public BigDecimal getMaxAmount() { return maxAmount; }
    public IngredientAmountUnit getUnit() { return unit; }
    public IngredientAmountBasis getBasis() { return basis; }
    public IngredientSubstanceBasis getSubstanceBasis() { return substanceBasis; }
    public String getRawClaimText() { return rawClaimText; }
    public IngredientAmountSourceType getSourceType() { return sourceType; }
    public String getSourceUrl() { return sourceUrl; }
    public String getPageTitle() { return pageTitle; }
    public String getSourceIngredientName() { return sourceIngredientName; }
    public LocalDate getCheckedAt() { return checkedAt; }
    public IngredientAmountVerificationStatus getVerificationStatus() { return verificationStatus; }
    public String getReviewNote() { return reviewNote; }
    public String getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
}
