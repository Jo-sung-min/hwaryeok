ALTER TABLE products ADD COLUMN image_url VARCHAR(500);

ALTER TABLE ingredients ADD COLUMN evidence_level VARCHAR(1) NOT NULL DEFAULT 'B';
ALTER TABLE ingredients ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ingredients ADD COLUMN display_order INTEGER NOT NULL DEFAULT 999;

ALTER TABLE ingredients ADD CONSTRAINT chk_ingredients_evidence_level
    CHECK (evidence_level IN ('A', 'B', 'C'));
ALTER TABLE ingredients ADD CONSTRAINT chk_ingredients_display_order
    CHECK (display_order > 0);

UPDATE ingredients
SET evidence_level = CASE
        WHEN id IN ('panthenol', 'hyaluronic-acid', 'ceramide-np', 'niacinamide') THEN 'A'
        WHEN id IN ('birch-sap', 'heartleaf', 'rice-extract', 'mugwort-extract', 'ethanol') THEN 'B'
        ELSE 'C'
    END,
    featured = TRUE,
    display_order = CASE id
        WHEN 'panthenol' THEN 1
        WHEN 'niacinamide' THEN 2
        WHEN 'ceramide-np' THEN 3
        WHEN 'hyaluronic-acid' THEN 4
        WHEN 'heartleaf' THEN 5
        WHEN 'mugwort-extract' THEN 6
        WHEN 'birch-sap' THEN 7
        WHEN 'rice-extract' THEN 8
        WHEN 'soybean-ferment' THEN 9
        WHEN 'shea-butter' THEN 10
        WHEN 'ethanol' THEN 11
        ELSE 999
    END;

CREATE INDEX idx_ingredients_featured_order
    ON ingredients (featured, display_order, name);

CREATE TABLE user_preferred_ingredients (
    user_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    ingredient_id VARCHAR(64) NOT NULL REFERENCES ingredients (id) ON DELETE CASCADE,
    priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 10),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, ingredient_id),
    UNIQUE (user_id, priority)
);

CREATE INDEX idx_user_preferred_ingredients_user_priority
    ON user_preferred_ingredients (user_id, priority);

CREATE TABLE product_images (
    product_id VARCHAR(64) PRIMARY KEY REFERENCES products (id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(40) NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
    image_data BYTEA NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
