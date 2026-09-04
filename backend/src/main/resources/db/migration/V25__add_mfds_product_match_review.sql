ALTER TABLE mfds_product_matches
    ADD COLUMN reviewed_by VARCHAR(36);

ALTER TABLE mfds_product_matches
    ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE mfds_product_matches
    ADD COLUMN review_note VARCHAR(500);

ALTER TABLE mfds_product_matches
    ADD CONSTRAINT fk_mfds_product_matches_reviewer
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_mfds_product_matches_reviewed
    ON mfds_product_matches (product_id, match_type, reviewed_at DESC);
