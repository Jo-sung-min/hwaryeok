CREATE TABLE user_recent_products (
    user_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id)
);

CREATE INDEX idx_user_recent_products_user_viewed
    ON user_recent_products (user_id, viewed_at DESC);
CREATE INDEX idx_user_recent_products_product
    ON user_recent_products (product_id);
