ALTER TABLE user_skin_profiles
    ADD COLUMN hydration_level VARCHAR(20) NOT NULL DEFAULT 'BALANCED';

ALTER TABLE user_skin_profiles
    ADD COLUMN oiliness_level VARCHAR(20) NOT NULL DEFAULT 'BALANCED';

ALTER TABLE user_skin_profiles
    ADD COLUMN sensitivity_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM';

ALTER TABLE user_skin_profiles
    ADD COLUMN breakout_frequency VARCHAR(20) NOT NULL DEFAULT 'OCCASIONAL';
