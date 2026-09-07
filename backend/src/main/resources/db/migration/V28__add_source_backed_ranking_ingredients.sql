-- Individual verified ingredient links are deliberately separate from product_ingredient_sources:
-- these records do not assert that a complete official ingredient list has been published.
CREATE TABLE product_ingredient_evidence (
    product_id VARCHAR(64) NOT NULL,
    ingredient_id VARCHAR(64) NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    page_title VARCHAR(300) NOT NULL,
    source_ingredient_name VARCHAR(300) NOT NULL,
    source_display_order INTEGER NOT NULL CHECK (source_display_order > 0),
    checked_at DATE NOT NULL,
    PRIMARY KEY (product_id, ingredient_id),
    FOREIGN KEY (product_id, ingredient_id)
        REFERENCES product_ingredients(product_id, ingredient_id) ON DELETE CASCADE
);

-- The current Korean brand page names the same 100 ml product as the existing catalog record.
-- Preserve any administrator-maintained relationship or position already present.
INSERT INTO product_ingredients (product_id, ingredient_id, display_order, concentration_note)
SELECT product.id, ingredient.id, 6, '공식 표기: 판테놀 · 전성분 6번째'
FROM products product CROSS JOIN ingredients ingredient
WHERE product.id = 'hwahae-2153055' AND product.brand = '웰라쥬'
  AND product.name = '리얼 히알루로닉 블루 100 앰플'
  AND ingredient.id = 'panthenol'
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredients (product_id, ingredient_id, display_order, concentration_note)
SELECT product.id, ingredient.id, 53, '공식 표기: 하이알루로닉애씨드(0.001ppb) · 전성분 53번째'
FROM products product CROSS JOIN ingredients ingredient
WHERE product.id = 'hwahae-2153055' AND product.brand = '웰라쥬'
  AND product.name = '리얼 히알루로닉 블루 100 앰플'
  AND ingredient.id = 'hyaluronic-acid'
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient_evidence (
    product_id, ingredient_id, source_url, page_title, source_ingredient_name, source_display_order, checked_at
)
SELECT relation.product_id, relation.ingredient_id,
       'https://www.wellage.co.kr/product/detail.html?product_no=1010',
       '리얼 히알루로닉 블루100 앰플 100ml', '판테놀', 6, DATE '2026-09-07'
FROM product_ingredients relation
WHERE relation.product_id = 'hwahae-2153055' AND relation.ingredient_id = 'panthenol'
  AND relation.display_order = 6 AND relation.concentration_note = '공식 표기: 판테놀 · 전성분 6번째'
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredient_evidence (
    product_id, ingredient_id, source_url, page_title, source_ingredient_name, source_display_order, checked_at
)
SELECT relation.product_id, relation.ingredient_id,
       'https://www.wellage.co.kr/product/detail.html?product_no=1010',
       '리얼 히알루로닉 블루100 앰플 100ml', '하이알루로닉애씨드(0.001ppb)', 53, DATE '2026-09-07'
FROM product_ingredients relation
WHERE relation.product_id = 'hwahae-2153055' AND relation.ingredient_id = 'hyaluronic-acid'
  AND relation.display_order = 53
  AND relation.concentration_note = '공식 표기: 하이알루로닉애씨드(0.001ppb) · 전성분 53번째'
ON CONFLICT DO NOTHING;
