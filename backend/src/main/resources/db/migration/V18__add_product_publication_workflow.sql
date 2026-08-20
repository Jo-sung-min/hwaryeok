ALTER TABLE products ADD COLUMN publication_status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE products ADD COLUMN source_url VARCHAR(500);
ALTER TABLE products ADD COLUMN source_checked_at DATE;

ALTER TABLE products
    ADD CONSTRAINT chk_products_publication_status
        CHECK (publication_status IN ('DRAFT', 'PUBLISHED', 'HIDDEN'));

CREATE INDEX idx_products_publication_status ON products (publication_status);
