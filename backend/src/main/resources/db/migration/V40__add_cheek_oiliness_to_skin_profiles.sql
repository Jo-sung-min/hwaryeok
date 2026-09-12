ALTER TABLE user_skin_profiles
    ADD COLUMN cheek_oiliness VARCHAR(20)
        CHECK (cheek_oiliness IS NULL OR cheek_oiliness IN ('LOW', 'BALANCED', 'HIGH'));
