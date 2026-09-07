CREATE TABLE review_firepower_ratings (
    review_id VARCHAR(36) NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
    voter_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id, voter_id)
);

CREATE INDEX idx_review_firepower_ratings_voter ON review_firepower_ratings (voter_id, review_id);
