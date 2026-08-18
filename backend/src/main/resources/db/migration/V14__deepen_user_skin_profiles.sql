ALTER TABLE user_skin_profiles
    ADD COLUMN profile_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE user_skin_profiles
    ADD COLUMN cleansing_tightness VARCHAR(20) NOT NULL DEFAULT 'SHORT';

ALTER TABLE user_skin_profiles
    ADD COLUMN redness_frequency VARCHAR(20) NOT NULL DEFAULT 'OCCASIONAL';

ALTER TABLE user_skin_profiles
    ADD COLUMN pore_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM';

ALTER TABLE user_skin_profiles
    ADD COLUMN texture_preference VARCHAR(20) NOT NULL DEFAULT 'BALANCED';

ALTER TABLE user_skin_profiles
    ADD COLUMN routine_complexity VARCHAR(20) NOT NULL DEFAULT 'STANDARD';

ALTER TABLE user_skin_profiles
    ADD COLUMN sunscreen_usage VARCHAR(20) NOT NULL DEFAULT 'SOMETIMES';

CREATE TABLE user_skin_profile_signals (
    user_id VARCHAR(36) NOT NULL REFERENCES user_skin_profiles (user_id) ON DELETE CASCADE,
    signal_group VARCHAR(30) NOT NULL,
    signal_value VARCHAR(60) NOT NULL,
    display_order INTEGER NOT NULL CHECK (display_order BETWEEN 0 AND 5),
    PRIMARY KEY (user_id, signal_group, signal_value),
    UNIQUE (user_id, signal_group, display_order)
);

CREATE INDEX idx_user_skin_profile_signals_group_order
    ON user_skin_profile_signals (user_id, signal_group, display_order);
