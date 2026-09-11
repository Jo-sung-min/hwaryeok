ALTER TABLE products
    ADD COLUMN net_content_value NUMERIC(12, 3);

ALTER TABLE products
    ADD COLUMN net_content_unit VARCHAR(10);

ALTER TABLE products
    ADD CONSTRAINT chk_products_net_content
        CHECK (
            (net_content_value IS NULL AND net_content_unit IS NULL)
            OR (
                net_content_value IS NOT NULL
                AND net_content_value > 0
                AND net_content_unit IN ('ML', 'G')
            )
        );

ALTER TABLE product_ingredients
    ADD COLUMN is_key_ingredient BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE product_ingredient_amount_claims (
    product_id VARCHAR(64) NOT NULL,
    ingredient_id VARCHAR(64) NOT NULL,
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('EXACT', 'RANGE', 'MINIMUM', 'MAXIMUM')),
    min_amount NUMERIC(24, 12),
    max_amount NUMERIC(24, 12),
    unit VARCHAR(20) NOT NULL CHECK (unit IN ('PERCENT', 'PPM', 'PPB', 'MG_PER_G', 'MG_PER_ML')),
    basis VARCHAR(20) NOT NULL CHECK (basis IN ('W_W', 'W_V', 'V_V', 'UNSPECIFIED')),
    substance_basis VARCHAR(40) NOT NULL
        CHECK (substance_basis IN ('PURE_INGREDIENT', 'RAW_MATERIAL_COMPLEX', 'DERIVATIVE_EQUIVALENT')),
    raw_claim_text VARCHAR(500) NOT NULL,
    source_type VARCHAR(40) NOT NULL
        CHECK (source_type IN ('BRAND_OFFICIAL', 'PACKAGE_LABEL', 'MFDS_FUNCTIONAL_REPORT', 'TEST_REPORT')),
    source_url VARCHAR(500) NOT NULL,
    page_title VARCHAR(300) NOT NULL,
    source_ingredient_name VARCHAR(300) NOT NULL,
    checked_at DATE NOT NULL,
    verification_status VARCHAR(20) NOT NULL
        CHECK (verification_status IN ('DRAFT', 'VERIFIED', 'STALE')),
    review_note VARCHAR(500),
    reviewed_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (product_id, ingredient_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
    CONSTRAINT chk_product_ingredient_amount_shape CHECK (
        (kind = 'EXACT' AND min_amount IS NOT NULL AND max_amount IS NOT NULL AND min_amount = max_amount)
        OR (kind = 'RANGE' AND min_amount IS NOT NULL AND max_amount IS NOT NULL AND min_amount <= max_amount)
        OR (kind = 'MINIMUM' AND min_amount IS NOT NULL AND max_amount IS NULL)
        OR (kind = 'MAXIMUM' AND min_amount IS NULL AND max_amount IS NOT NULL)
    ),
    CONSTRAINT chk_product_ingredient_amount_positive CHECK (
        (min_amount IS NULL OR min_amount > 0)
        AND (max_amount IS NULL OR max_amount > 0)
    ),
    CONSTRAINT chk_product_ingredient_amount_percent CHECK (
        unit <> 'PERCENT'
        OR (
            (min_amount IS NULL OR min_amount <= 100)
            AND (max_amount IS NULL OR max_amount <= 100)
        )
    )
);

CREATE INDEX idx_product_ingredient_amount_claims_ingredient
    ON product_ingredient_amount_claims (ingredient_id, verification_status, product_id);

CREATE INDEX idx_product_ingredient_amount_claims_status
    ON product_ingredient_amount_claims (verification_status, checked_at DESC);

UPDATE products
SET net_content_value = CASE id
        WHEN 'birch-cream' THEN 80.000
        WHEN 'hwahae-2079267' THEN 50.000
        WHEN 'hwahae-2153055' THEN 100.000
    END,
    net_content_unit = 'ML'
WHERE id IN ('birch-cream', 'hwahae-2079267', 'hwahae-2153055');

-- The official Round Lab page identifies birch sap as a key ingredient in the 50 mL ampoule.
-- Pick the next free display position only when the relationship is not already present.
INSERT INTO product_ingredients (
    product_id, ingredient_id, display_order, concentration_note, is_key_ingredient
)
SELECT
    product.id,
    ingredient.id,
    COALESCE((
        SELECT MAX(existing.display_order) + 1
        FROM product_ingredients existing
        WHERE existing.product_id = product.id
    ), 1),
    '공식 공개 함량: 자작나무 수액 10,000ppm',
    TRUE
FROM products product
CROSS JOIN ingredients ingredient
WHERE product.id = 'hwahae-2079267'
  AND ingredient.id = 'birch-sap'
ON CONFLICT DO NOTHING;

UPDATE product_ingredients
SET is_key_ingredient = TRUE
WHERE (product_id = 'birch-cream' AND ingredient_id = 'birch-sap')
   OR (product_id = 'hwahae-2079267' AND ingredient_id = 'birch-sap')
   OR (product_id = 'hwahae-2153055' AND ingredient_id = 'hyaluronic-acid');

INSERT INTO product_ingredient_amount_claims (
    product_id, ingredient_id, kind, min_amount, max_amount, unit, basis, substance_basis,
    raw_claim_text, source_type, source_url, page_title, source_ingredient_name, checked_at,
    verification_status, review_note, reviewed_at
)
SELECT
    'birch-cream', 'birch-sap', 'EXACT', 10000.000000000000, 10000.000000000000,
    'PPM', 'UNSPECIFIED', 'PURE_INGREDIENT',
    'Betula Platyphylla Japonica Juice(10,000ppm)', 'BRAND_OFFICIAL',
    'https://roundlab.com/products/birch-moisturizing-cream', 'Birch Moisturizing Cream',
    'Betula Platyphylla Japonica Juice', DATE '2026-09-11', 'VERIFIED',
    '브랜드 공식 제품 페이지에서 직접 확인', TIMESTAMP WITH TIME ZONE '2026-09-11 00:00:00+09:00'
WHERE EXISTS (
    SELECT 1 FROM product_ingredients
    WHERE product_id = 'birch-cream' AND ingredient_id = 'birch-sap'
)
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient_amount_claims (
    product_id, ingredient_id, kind, min_amount, max_amount, unit, basis, substance_basis,
    raw_claim_text, source_type, source_url, page_title, source_ingredient_name, checked_at,
    verification_status, review_note, reviewed_at
)
SELECT
    'hwahae-2079267', 'birch-sap', 'EXACT', 10000.000000000000, 10000.000000000000,
    'PPM', 'UNSPECIFIED', 'PURE_INGREDIENT',
    'Betula Platyphylla Japonica Juice(10,000ppm)', 'BRAND_OFFICIAL',
    'https://roundlab.com/products/birch-juice-ampoule', 'Birch Juice Moisturizing Ampoule',
    'Betula Platyphylla Japonica Juice', DATE '2026-09-11', 'VERIFIED',
    '브랜드 공식 제품 페이지에서 직접 확인', TIMESTAMP WITH TIME ZONE '2026-09-11 00:00:00+09:00'
WHERE EXISTS (
    SELECT 1 FROM product_ingredients
    WHERE product_id = 'hwahae-2079267' AND ingredient_id = 'birch-sap'
)
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient_amount_claims (
    product_id, ingredient_id, kind, min_amount, max_amount, unit, basis, substance_basis,
    raw_claim_text, source_type, source_url, page_title, source_ingredient_name, checked_at,
    verification_status, review_note, reviewed_at
)
SELECT
    'hwahae-2153055', 'hyaluronic-acid', 'EXACT', 0.001000000000, 0.001000000000,
    'PPB', 'UNSPECIFIED', 'PURE_INGREDIENT',
    '하이알루로닉애씨드(0.001ppb)', 'BRAND_OFFICIAL',
    'https://www.wellage.co.kr/product/detail.html?product_no=1010',
    '리얼 히알루로닉 블루100 앰플 100ml', '하이알루로닉애씨드', DATE '2026-09-07',
    'VERIFIED', '브랜드 공식 제품 페이지에서 직접 확인',
    TIMESTAMP WITH TIME ZONE '2026-09-07 00:00:00+09:00'
WHERE EXISTS (
    SELECT 1 FROM product_ingredients
    WHERE product_id = 'hwahae-2153055' AND ingredient_id = 'hyaluronic-acid'
)
ON CONFLICT DO NOTHING;
