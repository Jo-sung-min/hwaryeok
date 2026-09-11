package com.hwaryeok.ingredient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductNetContentUnit;
import com.hwaryeok.product.ProductPublicationStatus;
import com.hwaryeok.product.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ProductIngredientAmountServiceTest {

    @Autowired private ProductIngredientAmountService service;
    @Autowired private ProductRepository productRepository;
    @Autowired private IngredientService ingredientService;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void exposesOnlyVerifiedClaimsPubliclyButKeepsOtherStatusesForAdmin() {
        Product product = productRepository.findById("birch-cream").orElseThrow();
        service.save("birch-cream", "birch-sap", null, request(
                IngredientAmountKind.EXACT, "10000", "10000", IngredientAmountUnit.PPM,
                IngredientAmountBasis.UNSPECIFIED, IngredientAmountVerificationStatus.DRAFT
        ));

        assertThat(service.findVerifiedResponses(product)).isEmpty();
        assertThat(service.findAdminResponses(product)).containsKey("birch-sap");
        assertThat(service.findAdminResponses(product).get("birch-sap").verificationStatus())
                .isEqualTo(IngredientAmountVerificationStatus.DRAFT);

        service.save("birch-cream", "birch-sap", null, request(
                IngredientAmountKind.EXACT, "10000", "10000", IngredientAmountUnit.PPM,
                IngredientAmountBasis.UNSPECIFIED, IngredientAmountVerificationStatus.VERIFIED
        ));
        assertThat(service.findVerifiedResponses(product)).containsKey("birch-sap");
    }

    @Test
    void validatesAmountShapeAndNeverUsesZeroForAnUndisclosedAmount() {
        assertThatThrownBy(() -> service.save("birch-cream", "birch-sap", null, request(
                IngredientAmountKind.EXACT, "1", "2", IngredientAmountUnit.PERCENT,
                IngredientAmountBasis.W_V, IngredientAmountVerificationStatus.DRAFT
        ))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("조합");

        assertThatThrownBy(() -> service.save("birch-cream", "birch-sap", null, request(
                IngredientAmountKind.MINIMUM, "0", null, IngredientAmountUnit.PPM,
                IngredientAmountBasis.W_V, IngredientAmountVerificationStatus.DRAFT
        ))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("0으로 입력하지 말고");

        assertThatThrownBy(() -> service.save("birch-cream", "birch-sap", null, request(
                IngredientAmountKind.EXACT, "10", "10", IngredientAmountUnit.MG_PER_G,
                IngredientAmountBasis.W_V, IngredientAmountVerificationStatus.DRAFT
        ))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("W_W");

        assertThatThrownBy(() -> service.save("birch-cream", "birch-sap", null, request(
                IngredientAmountKind.EXACT, "101", "101", IngredientAmountUnit.PERCENT,
                IngredientAmountBasis.W_V, IngredientAmountVerificationStatus.DRAFT
        ))).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("100%");
    }

    @Test
    void databaseAlsoRejectsZeroWhenServiceValidationIsBypassed() {
        jdbc.update("DELETE FROM product_ingredient_amount_claims WHERE product_id = ? AND ingredient_id = ?",
                "birch-cream", "birch-sap");

        assertThatThrownBy(() -> insertRawExactPercent("0"))
                .isInstanceOf(DataAccessException.class);
    }

    @Test
    void databaseAlsoRejectsPercentAboveOneHundred() {
        jdbc.update("DELETE FROM product_ingredient_amount_claims WHERE product_id = ? AND ingredient_id = ?",
                "birch-cream", "birch-sap");

        assertThatThrownBy(() -> insertRawExactPercent("101"))
                .isInstanceOf(DataAccessException.class);
    }

    @Test
    void convertsOnlyCompatibleAmountAndContainerUnits() {
        assertThat(amount("50", ProductNetContentUnit.G, IngredientAmountKind.EXACT,
                "2", "2", IngredientAmountUnit.PERCENT, IngredientAmountBasis.W_W).amountPerContainer())
                .isEqualTo("1,000 mg / 본품");
        assertThat(amount("30", ProductNetContentUnit.ML, IngredientAmountKind.EXACT,
                "2", "2", IngredientAmountUnit.PERCENT, IngredientAmountBasis.W_V).amountPerContainer())
                .isEqualTo("600 mg / 본품");
        assertThat(amount("30", ProductNetContentUnit.ML, IngredientAmountKind.RANGE,
                "1", "2", IngredientAmountUnit.PERCENT, IngredientAmountBasis.V_V).amountPerContainer())
                .isEqualTo("0.3–0.6 mL / 본품");
        assertThat(amount("30", ProductNetContentUnit.ML, IngredientAmountKind.EXACT,
                "250", "250", IngredientAmountUnit.PPM, IngredientAmountBasis.W_V).amountPerContainer())
                .isEqualTo("7.5 mg / 본품");
        assertThat(amount("100", ProductNetContentUnit.ML, IngredientAmountKind.EXACT,
                "0.001", "0.001", IngredientAmountUnit.PPB, IngredientAmountBasis.W_V).amountPerContainer())
                .isEqualTo("0.0000001 mg / 본품");
        assertThat(amount("100", ProductNetContentUnit.ML, IngredientAmountKind.EXACT,
                "0.001", "0.001", IngredientAmountUnit.PPB, IngredientAmountBasis.UNSPECIFIED).amountPerContainer())
                .isNull();
        assertThat(amount("30", ProductNetContentUnit.ML, IngredientAmountKind.EXACT,
                "2", "2", IngredientAmountUnit.PERCENT, IngredientAmountBasis.W_W).amountPerContainer())
                .isNull();
    }

    @Test
    void seededClaimsExposeHonestLabelsWithoutInventingPerContainerAmounts() {
        Product birchCream = productRepository.findById("birch-cream").orElseThrow();
        Product wellage = productRepository.findById("hwahae-2153055").orElseThrow();

        IngredientAmountResponse birch = service.findVerifiedResponses(birchCream).get("birch-sap");
        IngredientAmountResponse hyaluronic = service.findVerifiedResponses(wellage).get("hyaluronic-acid");

        assertThat(birchCream.getNetContentValue()).isEqualByComparingTo("80");
        assertThat(birch.displayValue()).isEqualTo("10,000 ppm");
        assertThat(birch.amountPerContainer()).isNull();
        assertThat(birch.comparisonNote()).contains("배합 기준이 공개되지 않아");
        assertThat(birch.reviewNote()).contains("브랜드 공식 제품 페이지");
        assertThat(birch.reviewedAt()).isNotNull();
        assertThat(hyaluronic.displayValue()).isEqualTo("0.001 ppb");
        assertThat(hyaluronic.amountPerContainer()).isNull();

        ProductIngredientsResponse productIngredients = ingredientService.findProductIngredients(
                "birch-cream", null, null
        );
        assertThat(productIngredients.verifiedAmountCount()).isEqualTo(1);
        assertThat(productIngredients.ingredients()).filteredOn(ProductIngredientItemResponse::isKeyIngredient)
                .singleElement().satisfies(item -> {
                    assertThat(item.id()).isEqualTo("birch-sap");
                    assertThat(item.amount()).isNotNull();
                    assertThat(item.amount().verificationStatus())
                            .isEqualTo(IngredientAmountVerificationStatus.VERIFIED);
                });
    }

    private void insertRawExactPercent(String amount) {
        jdbc.update("""
                INSERT INTO product_ingredient_amount_claims (
                    product_id, ingredient_id, kind, min_amount, max_amount, unit, basis,
                    substance_basis, raw_claim_text, source_type, source_url, page_title,
                    source_ingredient_name, checked_at, verification_status
                ) VALUES (
                    'birch-cream', 'birch-sap', 'EXACT', ?, ?, 'PERCENT', 'W_V',
                    'PURE_INGREDIENT', '직접 SQL 테스트', 'TEST_REPORT',
                    'https://example.com/test-report', '직접 SQL 테스트', '자작나무 수액',
                    DATE '2026-09-11', 'DRAFT'
                )
                """, new BigDecimal(amount), new BigDecimal(amount));
    }

    private AdminProductIngredientAmountRequest request(
            IngredientAmountKind kind,
            String minimum,
            String maximum,
            IngredientAmountUnit unit,
            IngredientAmountBasis basis,
            IngredientAmountVerificationStatus status
    ) {
        return new AdminProductIngredientAmountRequest(
                kind,
                decimal(minimum),
                decimal(maximum),
                unit,
                basis,
                IngredientSubstanceBasis.PURE_INGREDIENT,
                "공식 표기 원문",
                IngredientAmountSourceType.BRAND_OFFICIAL,
                "https://example.com/product",
                "공식 제품",
                "테스트 성분",
                LocalDate.of(2026, 9, 11),
                status,
                "관리자 검수"
        );
    }

    private IngredientAmountResponse amount(
            String netContent,
            ProductNetContentUnit netContentUnit,
            IngredientAmountKind kind,
            String minimum,
            String maximum,
            IngredientAmountUnit unit,
            IngredientAmountBasis basis
    ) {
        Product product = new Product(
                "amount-product", "테스트", "함량 제품", "세럼", 80, "보습", "진정", 10000,
                "rose", null, null, ProductPublicationStatus.PUBLISHED, null, null,
                new BigDecimal(netContent), netContentUnit
        );
        ProductIngredientAmountClaim claim = new ProductIngredientAmountClaim("amount-product", "amount-ingredient");
        claim.update(
                kind, decimal(minimum), decimal(maximum), unit, basis,
                IngredientSubstanceBasis.PURE_INGREDIENT, "공식 표기 원문",
                IngredientAmountSourceType.TEST_REPORT, "https://example.com/report", "시험성적서",
                "테스트 성분", LocalDate.of(2026, 9, 11), IngredientAmountVerificationStatus.VERIFIED,
                null, null, Instant.parse("2026-09-11T00:00:00Z")
        );
        return IngredientAmountResponse.from(claim, product);
    }

    private BigDecimal decimal(String value) {
        return value == null ? null : new BigDecimal(value);
    }
}
