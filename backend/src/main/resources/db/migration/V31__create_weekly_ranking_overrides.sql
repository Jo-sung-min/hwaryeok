CREATE TABLE weekly_ranking_overrides (
    week_start DATE NOT NULL,
    product_id VARCHAR(64) NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL CHECK (display_order BETWEEN 1 AND 10),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (week_start, product_id),
    UNIQUE (week_start, display_order)
);

CREATE INDEX idx_weekly_ranking_overrides_order
    ON weekly_ranking_overrides (week_start, display_order);
