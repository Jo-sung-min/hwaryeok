CREATE TABLE auth_login_attempts (
    key_hash VARCHAR(64) PRIMARY KEY,
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    window_started TIMESTAMP WITH TIME ZONE NOT NULL,
    blocked_until TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_auth_login_attempts_updated_at ON auth_login_attempts (updated_at);
