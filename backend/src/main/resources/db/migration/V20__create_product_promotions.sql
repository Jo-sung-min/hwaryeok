CREATE TABLE product_promotions (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL UNIQUE REFERENCES products (id) ON DELETE CASCADE,
    recommendation_score INTEGER NOT NULL CHECK (recommendation_score BETWEEN 0 AND 100),
    headline VARCHAR(100) NOT NULL,
    recommendation_reason VARCHAR(500) NOT NULL,
    destination_url VARCHAR(500) NOT NULL,
    emerging_brand BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    starts_on DATE,
    ends_on DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_product_promotions_status CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED')),
    CONSTRAINT chk_product_promotions_period CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);

CREATE INDEX idx_product_promotions_exposure
    ON product_promotions (status, emerging_brand, recommendation_score, starts_on, ends_on);
