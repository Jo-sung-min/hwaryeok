CREATE TABLE reviewer_profiles (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    introduction_json TEXT NOT NULL DEFAULT '[]',
    blog_url VARCHAR(2048),
    instagram_url VARCHAR(2048),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reviewer_profiles_introduction_length CHECK (LENGTH(introduction_json) <= 50000),
    CONSTRAINT chk_reviewer_profiles_blog_url CHECK (
        blog_url IS NULL OR LOWER(blog_url) LIKE 'http://%' OR LOWER(blog_url) LIKE 'https://%'
    ),
    CONSTRAINT chk_reviewer_profiles_instagram_url CHECK (
        instagram_url IS NULL OR LOWER(instagram_url) LIKE 'http://%' OR LOWER(instagram_url) LIKE 'https://%'
    )
);
