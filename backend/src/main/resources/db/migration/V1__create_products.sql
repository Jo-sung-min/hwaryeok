CREATE TABLE products (
    id VARCHAR(64) PRIMARY KEY,
    brand VARCHAR(80) NOT NULL,
    name VARCHAR(140) NOT NULL,
    category VARCHAR(40) NOT NULL,
    base_score INTEGER NOT NULL CHECK (base_score BETWEEN 0 AND 100),
    benefit VARCHAR(80) NOT NULL,
    sub_benefit VARCHAR(80) NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    tone VARCHAR(20) NOT NULL,
    tag VARCHAR(80)
);

CREATE INDEX idx_products_brand ON products (brand);
CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_products_base_score ON products (base_score DESC);
