CREATE TABLE mfds_product_review_decisions (
    product_id VARCHAR(64) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    review_status VARCHAR(20) NOT NULL CHECK (review_status IN ('ADMIN_VERIFIED', 'NO_MATCH')),
    report_id VARCHAR(120) REFERENCES mfds_cosmetic_products(report_id) ON DELETE CASCADE,
    reviewed_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    review_note VARCHAR(500),
    CHECK (
        (review_status = 'ADMIN_VERIFIED' AND report_id IS NOT NULL)
        OR (review_status = 'NO_MATCH' AND report_id IS NULL)
    )
);

CREATE INDEX idx_mfds_product_review_decisions_status
    ON mfds_product_review_decisions (review_status, reviewed_at DESC);

INSERT INTO mfds_product_review_decisions (
    product_id, review_status, report_id, reviewed_by, reviewed_at, review_note
)
SELECT
    product_id,
    'ADMIN_VERIFIED',
    report_id,
    reviewed_by,
    COALESCE(reviewed_at, matched_at),
    review_note
FROM mfds_product_matches
WHERE match_type = 'ADMIN_VERIFIED';
