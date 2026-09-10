CREATE TABLE skin_photo_usage (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    request_count INTEGER NOT NULL CHECK (request_count >= 0),
    last_requested_at TIMESTAMP WITH TIME ZONE NOT NULL
);
