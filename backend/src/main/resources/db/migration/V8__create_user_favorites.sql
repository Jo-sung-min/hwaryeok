CREATE TABLE user_favorites (
    user_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id)
);

CREATE INDEX idx_user_favorites_user_created ON user_favorites (user_id, created_at DESC);
CREATE INDEX idx_user_favorites_product ON user_favorites (product_id);
