CREATE TABLE profile_image_upload_usage (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    issued_count INTEGER NOT NULL CHECK (issued_count >= 0),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
