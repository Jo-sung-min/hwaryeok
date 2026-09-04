CREATE TABLE mfds_ingredient_regulation_reviews (
    ingredient_id VARCHAR(64) NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    source_record_id VARCHAR(120) NOT NULL REFERENCES mfds_ingredient_regulations(source_record_id) ON DELETE CASCADE,
    reviewed_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    review_note VARCHAR(500),
    PRIMARY KEY (ingredient_id, source_record_id)
);

CREATE INDEX idx_mfds_ingredient_regulation_reviews_recent
    ON mfds_ingredient_regulation_reviews (reviewed_at DESC, ingredient_id);
