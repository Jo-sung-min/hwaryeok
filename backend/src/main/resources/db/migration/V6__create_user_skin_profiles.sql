CREATE TABLE user_skin_profiles (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    skin_type VARCHAR(20) NOT NULL CHECK (skin_type IN ('건성', '지성', '복합성', '수부지', '중성', '민감')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_skin_profiles_skin_type ON user_skin_profiles (skin_type);
CREATE INDEX idx_user_skin_profiles_updated_at ON user_skin_profiles (updated_at DESC);

CREATE TABLE user_skin_concerns (
    user_id VARCHAR(36) NOT NULL REFERENCES user_skin_profiles (user_id) ON DELETE CASCADE,
    concern VARCHAR(40) NOT NULL CHECK (concern IN ('속건조', '민감', '모공', '붉은기', '피부 장벽', '각질', '칙칙함', '탄력')),
    display_order INTEGER NOT NULL CHECK (display_order BETWEEN 0 AND 3),
    PRIMARY KEY (user_id, concern),
    UNIQUE (user_id, display_order)
);

CREATE INDEX idx_user_skin_concerns_user_order ON user_skin_concerns (user_id, display_order);
