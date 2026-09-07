CREATE TABLE product_usage_videos (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    author_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(2000),
    video_url VARCHAR(2048) NOT NULL,
    video_id VARCHAR(11) NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    channel_url VARCHAR(2048) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN')),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order BETWEEN 0 AND 100000),
    moderation_note VARCHAR(1000),
    reviewed_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usage_video_author_product_video UNIQUE (author_id, product_id, video_id),
    CONSTRAINT ck_usage_video_featured CHECK (featured = FALSE OR status = 'APPROVED')
);

CREATE INDEX idx_usage_videos_public ON product_usage_videos (product_id, status, featured, display_order);
CREATE INDEX idx_usage_videos_author ON product_usage_videos (author_id, created_at DESC);
CREATE INDEX idx_usage_videos_moderation ON product_usage_videos (status, created_at DESC);
