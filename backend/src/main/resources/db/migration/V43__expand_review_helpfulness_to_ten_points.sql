CREATE TABLE review_firepower_ratings_v43 (
    review_id VARCHAR(36) NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
    voter_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id, voter_id)
);

-- 기존 1~5점의 의미를 유지하도록 2배로 옮깁니다. 예: 5점은 새 기준의 10점입니다.
INSERT INTO review_firepower_ratings_v43 (review_id, voter_id, score, created_at, updated_at)
SELECT review_id, voter_id, score * 2, created_at, updated_at
FROM review_firepower_ratings;

DROP TABLE review_firepower_ratings;
ALTER TABLE review_firepower_ratings_v43 RENAME TO review_firepower_ratings;

CREATE INDEX idx_review_firepower_ratings_voter ON review_firepower_ratings (voter_id, review_id);
