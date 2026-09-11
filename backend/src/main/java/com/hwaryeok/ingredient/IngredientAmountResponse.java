package com.hwaryeok.ingredient;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductNetContentUnit;

public record IngredientAmountResponse(
        IngredientAmountKind kind,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        IngredientAmountUnit unit,
        IngredientAmountBasis basis,
        IngredientSubstanceBasis substanceBasis,
        String displayValue,
        String amountPerContainer,
        String comparisonNote,
        String rawClaimText,
        IngredientAmountSourceType sourceType,
        String sourceUrl,
        String pageTitle,
        String sourceIngredientName,
        LocalDate checkedAt,
        IngredientAmountVerificationStatus verificationStatus,
        String reviewNote,
        Instant reviewedAt
) {
    private static final BigDecimal TEN = BigDecimal.TEN;
    private static final BigDecimal THOUSAND = BigDecimal.valueOf(1_000);
    private static final BigDecimal MILLION = BigDecimal.valueOf(1_000_000);
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    public static IngredientAmountResponse from(ProductIngredientAmountClaim claim, Product product) {
        return new IngredientAmountResponse(
                claim.getKind(),
                claim.getMinAmount(),
                claim.getMaxAmount(),
                claim.getUnit(),
                claim.getBasis(),
                claim.getSubstanceBasis(),
                display(claim),
                amountPerContainer(claim, product),
                comparisonNote(claim),
                claim.getRawClaimText(),
                claim.getSourceType(),
                claim.getSourceUrl(),
                claim.getPageTitle(),
                claim.getSourceIngredientName(),
                claim.getCheckedAt(),
                claim.getVerificationStatus(),
                claim.getReviewNote(),
                claim.getReviewedAt()
        );
    }

    private static String display(ProductIngredientAmountClaim claim) {
        String unit = unitLabel(claim.getUnit());
        return switch (claim.getKind()) {
            case EXACT -> number(claim.getMinAmount()) + unit;
            case RANGE -> number(claim.getMinAmount()) + "–" + number(claim.getMaxAmount()) + unit;
            case MINIMUM -> number(claim.getMinAmount()) + unit + " 이상";
            case MAXIMUM -> number(claim.getMaxAmount()) + unit + " 이하";
        };
    }

    private static String amountPerContainer(ProductIngredientAmountClaim claim, Product product) {
        if (product == null || product.getNetContentValue() == null || product.getNetContentUnit() == null) return null;
        Conversion conversion = conversion(claim, product.getNetContentValue(), product.getNetContentUnit());
        if (conversion == null) return null;
        String unit = " " + conversion.unit() + " / 본품";
        return switch (claim.getKind()) {
            case EXACT -> number(conversion.min()) + unit;
            case RANGE -> number(conversion.min()) + "–" + number(conversion.max()) + unit;
            case MINIMUM -> number(conversion.min()) + unit + " 이상";
            case MAXIMUM -> number(conversion.max()) + unit + " 이하";
        };
    }

    private static Conversion conversion(
            ProductIngredientAmountClaim claim,
            BigDecimal netContent,
            ProductNetContentUnit netContentUnit
    ) {
        BigDecimal factor;
        String outputUnit = "mg";
        switch (claim.getUnit()) {
            case PERCENT -> {
                if (claim.getBasis() == IngredientAmountBasis.W_W && netContentUnit == ProductNetContentUnit.G) {
                    factor = netContent.multiply(TEN);
                } else if (claim.getBasis() == IngredientAmountBasis.W_V && netContentUnit == ProductNetContentUnit.ML) {
                    factor = netContent.multiply(TEN);
                } else if (claim.getBasis() == IngredientAmountBasis.V_V && netContentUnit == ProductNetContentUnit.ML) {
                    factor = netContent.divide(HUNDRED);
                    outputUnit = "mL";
                } else {
                    return null;
                }
            }
            case PPM -> {
                if (!massFractionCompatible(claim.getBasis(), netContentUnit)) return null;
                factor = netContent.divide(THOUSAND);
            }
            case PPB -> {
                if (!massFractionCompatible(claim.getBasis(), netContentUnit)) return null;
                factor = netContent.divide(MILLION);
            }
            case MG_PER_G -> {
                if (claim.getBasis() != IngredientAmountBasis.W_W
                        || netContentUnit != ProductNetContentUnit.G) return null;
                factor = netContent;
            }
            case MG_PER_ML -> {
                if (claim.getBasis() != IngredientAmountBasis.W_V
                        || netContentUnit != ProductNetContentUnit.ML) return null;
                factor = netContent;
            }
            default -> throw new IllegalStateException("지원하지 않는 함량 단위예요.");
        }
        BigDecimal minimum = claim.getMinAmount() == null ? null : claim.getMinAmount().multiply(factor);
        BigDecimal maximum = claim.getMaxAmount() == null ? null : claim.getMaxAmount().multiply(factor);
        return new Conversion(minimum, maximum, outputUnit);
    }

    private static boolean massFractionCompatible(IngredientAmountBasis basis, ProductNetContentUnit unit) {
        return (basis == IngredientAmountBasis.W_W && unit == ProductNetContentUnit.G)
                || (basis == IngredientAmountBasis.W_V && unit == ProductNetContentUnit.ML);
    }

    private static String comparisonNote(ProductIngredientAmountClaim claim) {
        if (claim.getVerificationStatus() != IngredientAmountVerificationStatus.VERIFIED) {
            return "관리자 검수 전 정보라 추천과 공개 랭킹에는 반영하지 않아요.";
        }
        if (claim.getSubstanceBasis() == IngredientSubstanceBasis.RAW_MATERIAL_COMPLEX) {
            return "복합원료 전체의 공개 함량이며 순수 활성성분 함량과 같지 않아요.";
        }
        if (claim.getSubstanceBasis() == IngredientSubstanceBasis.DERIVATIVE_EQUIVALENT) {
            return "유도체 환산 기준의 공개 함량이며 원성분 함량과 직접 합산하지 않아요.";
        }
        if (claim.getBasis() == IngredientAmountBasis.UNSPECIFIED) {
            return "배합 기준이 공개되지 않아 다른 제품과 직접 수치 비교하지 않아요.";
        }
        return "같은 성분과 같은 배합 기준끼리만 비교할 수 있으며, 함량이 높다고 항상 더 잘 맞는 것은 아니에요.";
    }

    private static String unitLabel(IngredientAmountUnit unit) {
        return switch (unit) {
            case PERCENT -> "%";
            case PPM -> " ppm";
            case PPB -> " ppb";
            case MG_PER_G -> " mg/g";
            case MG_PER_ML -> " mg/mL";
        };
    }

    private static String number(BigDecimal value) {
        DecimalFormat format = new DecimalFormat("#,##0.############", DecimalFormatSymbols.getInstance(Locale.US));
        format.setParseBigDecimal(true);
        return format.format(value.stripTrailingZeros());
    }

    private record Conversion(BigDecimal min, BigDecimal max, String unit) {
    }
}
