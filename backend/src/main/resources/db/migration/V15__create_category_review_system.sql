CREATE TABLE product_categories (
    id VARCHAR(40) PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL CHECK (display_order > 0),
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_templates (
    id VARCHAR(64) PRIMARY KEY,
    category_id VARCHAR(40) NOT NULL REFERENCES product_categories (id) ON DELETE RESTRICT,
    version INTEGER NOT NULL CHECK (version > 0),
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category_id, version)
);

CREATE TABLE review_criteria (
    id VARCHAR(64) PRIMARY KEY,
    template_id VARCHAR(64) NOT NULL REFERENCES review_templates (id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(80) NOT NULL,
    description VARCHAR(300) NOT NULL,
    weight NUMERIC(5, 2) NOT NULL DEFAULT 1.00 CHECK (weight > 0),
    display_order INTEGER NOT NULL CHECK (display_order > 0),
    use_yn BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (template_id, code),
    UNIQUE (template_id, display_order)
);

CREATE TABLE reviews (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    template_id VARCHAR(64) NOT NULL REFERENCES review_templates (id) ON DELETE RESTRICT,
    total_score NUMERIC(5, 2) NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    content VARCHAR(2000) NOT NULL,
    skin_type VARCHAR(40) NOT NULL,
    usage_period VARCHAR(30) NOT NULL,
    repurchase_yn BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, user_id)
);

CREATE TABLE review_scores (
    id VARCHAR(36) PRIMARY KEY,
    review_id VARCHAR(36) NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
    criteria_id VARCHAR(64) NOT NULL REFERENCES review_criteria (id) ON DELETE RESTRICT,
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (review_id, criteria_id)
);

CREATE INDEX idx_review_templates_category ON review_templates (category_id, use_yn, version DESC);
CREATE INDEX idx_review_criteria_template ON review_criteria (template_id, use_yn, display_order);
CREATE INDEX idx_reviews_product_created ON reviews (product_id, created_at DESC);
CREATE INDEX idx_reviews_user_created ON reviews (user_id, created_at DESC);
CREATE INDEX idx_review_scores_criteria ON review_scores (criteria_id);

INSERT INTO product_categories (id, name, display_order) VALUES
    ('MOISTURIZER', '수분크림', 1),
    ('SUNSCREEN', '선크림', 2),
    ('CLEANSER', '클렌징폼', 3),
    ('TONER', '토너', 4),
    ('ESSENCE_SERUM', '에센스·세럼', 5),
    ('GENERIC', '기타 화장품', 99);

INSERT INTO review_templates (id, category_id, version) VALUES
    ('review-moisturizer-v1', 'MOISTURIZER', 1),
    ('review-sunscreen-v1', 'SUNSCREEN', 1),
    ('review-cleanser-v1', 'CLEANSER', 1),
    ('review-toner-v1', 'TONER', 1),
    ('review-essence-serum-v1', 'ESSENCE_SERUM', 1),
    ('review-generic-v1', 'GENERIC', 1);

INSERT INTO review_criteria (id, template_id, code, name, description, display_order) VALUES
    ('moisture', 'review-moisturizer-v1', 'MOISTURE', '보습력', '피부에 충분한 수분감을 제공했나요?', 1),
    ('spread', 'review-moisturizer-v1', 'SPREAD', '발림성', '피부에 부드럽고 편하게 펴 발리나요?', 2),
    ('absorption', 'review-moisturizer-v1', 'ABSORPTION', '흡수력', '겉돌지 않고 피부에 잘 흡수되나요?', 3),
    ('lasting', 'review-moisturizer-v1', 'LASTING', '보습 지속력', '시간이 지나도 촉촉함이 유지되나요?', 4),
    ('freshness', 'review-moisturizer-v1', 'FRESHNESS', '산뜻함', '끈적이거나 답답하지 않고 산뜻한가요?', 5),
    ('low-irritation', 'review-moisturizer-v1', 'LOW_IRRITATION', '자극 없음', '사용 후 따가움, 붉어짐 등 불편함이 없었나요?', 6),
    ('ingredient', 'review-moisturizer-v1', 'INGREDIENT', '성분 만족도', '제품의 주요 성분과 사용 후 만족도가 좋았나요?', 7),
    ('price', 'review-moisturizer-v1', 'PRICE', '가격 만족도', '가격 대비 제품의 품질과 효과가 만족스러웠나요?', 8),

    ('sun-protection', 'review-sunscreen-v1', 'SUN_PROTECTION', '자외선 차단 만족도', '자외선 차단 기능과 사용 경험이 만족스러웠나요?', 1),
    ('sun-spread', 'review-sunscreen-v1', 'SPREAD', '발림성', '피부에 고르게 부드럽게 펴 발리나요?', 2),
    ('sun-absorption', 'review-sunscreen-v1', 'ABSORPTION', '흡수력', '겉돌지 않고 피부에 잘 밀착되나요?', 3),
    ('sun-no-white-cast', 'review-sunscreen-v1', 'NO_WHITE_CAST', '백탁 없음', '피부에 하얗게 남는 백탁이 없었나요?', 4),
    ('sun-no-eye-irritation', 'review-sunscreen-v1', 'NO_EYE_IRRITATION', '눈시림 없음', '눈가에 사용해도 눈시림이 없었나요?', 5),
    ('sun-no-pilling', 'review-sunscreen-v1', 'NO_PILLING', '밀림 없음', '메이크업 전후에 제품이 밀리지 않았나요?', 6),
    ('sun-lasting', 'review-sunscreen-v1', 'LASTING', '지속력', '시간이 지나도 편안한 사용감이 유지되나요?', 7),
    ('sun-cleansing', 'review-sunscreen-v1', 'CLEANSING', '세정 편의성', '평소 세안으로 부담 없이 지워졌나요?', 8),
    ('sun-price', 'review-sunscreen-v1', 'PRICE', '가격 만족도', '가격 대비 품질과 사용량이 만족스러웠나요?', 9),

    ('clean-cleansing', 'review-cleanser-v1', 'CLEANSING', '세정력', '노폐물과 메이크업 잔여물이 충분히 씻겼나요?', 1),
    ('clean-moisture', 'review-cleanser-v1', 'AFTER_MOISTURE', '세안 후 촉촉함', '세안 직후 피부가 심하게 당기지 않았나요?', 2),
    ('clean-low-irritation', 'review-cleanser-v1', 'LOW_IRRITATION', '자극 없음', '세안 중과 세안 후에 따가움이나 붉어짐이 없었나요?', 3),
    ('clean-foam', 'review-cleanser-v1', 'FOAM', '거품 만족도', '거품의 양과 밀도가 사용하기 편했나요?', 4),
    ('clean-no-residue', 'review-cleanser-v1', 'NO_RESIDUE', '잔여감 없음', '헹군 뒤 미끄럽거나 답답한 잔여감이 없었나요?', 5),
    ('clean-scent', 'review-cleanser-v1', 'SCENT', '향 만족도', '향의 강도와 잔향이 편안했나요?', 6),
    ('clean-convenience', 'review-cleanser-v1', 'CONVENIENCE', '사용 편의성', '용기와 제형을 일상에서 편하게 사용할 수 있었나요?', 7),
    ('clean-price', 'review-cleanser-v1', 'PRICE', '가격 만족도', '가격 대비 세정 경험과 사용량이 만족스러웠나요?', 8),

    ('toner-moisture', 'review-toner-v1', 'MOISTURE', '수분감', '피부에 편안한 수분감을 채워줬나요?', 1),
    ('toner-absorption', 'review-toner-v1', 'ABSORPTION', '흡수력', '겉돌지 않고 빠르게 흡수되나요?', 2),
    ('toner-freshness', 'review-toner-v1', 'FRESHNESS', '산뜻함', '답답하지 않고 산뜻하게 마무리되나요?', 3),
    ('toner-soothing', 'review-toner-v1', 'SOOTHING', '진정 만족도', '사용 후 피부가 편안하게 진정됐나요?', 4),
    ('toner-low-irritation', 'review-toner-v1', 'LOW_IRRITATION', '자극 없음', '따가움이나 붉어짐 같은 불편함이 없었나요?', 5),
    ('toner-no-stickiness', 'review-toner-v1', 'NO_STICKINESS', '끈적임 없음', '흡수 후 불편한 끈적임이 남지 않았나요?', 6),
    ('toner-ingredient', 'review-toner-v1', 'INGREDIENT', '성분 만족도', '주요 성분과 사용 후 만족도가 좋았나요?', 7),
    ('toner-price', 'review-toner-v1', 'PRICE', '가격 만족도', '가격 대비 품질과 사용량이 만족스러웠나요?', 8),

    ('serum-benefit', 'review-essence-serum-v1', 'EXPECTED_BENEFIT', '기대 효능 만족도', '제품이 안내한 대표 기능을 사용하며 체감했나요?', 1),
    ('serum-absorption', 'review-essence-serum-v1', 'ABSORPTION', '흡수력', '겉돌지 않고 피부에 잘 흡수되나요?', 2),
    ('serum-spread', 'review-essence-serum-v1', 'SPREAD', '발림성', '적은 양으로도 피부에 고르게 펴 발리나요?', 3),
    ('serum-long-use', 'review-essence-serum-v1', 'LONG_USE', '지속 사용 만족도', '꾸준히 사용했을 때 전반적으로 만족스러웠나요?', 4),
    ('serum-low-irritation', 'review-essence-serum-v1', 'LOW_IRRITATION', '자극 없음', '사용 후 따가움이나 붉어짐이 없었나요?', 5),
    ('serum-texture', 'review-essence-serum-v1', 'TEXTURE', '사용감', '제형과 마무리감이 일상에서 사용하기 편했나요?', 6),
    ('serum-ingredient', 'review-essence-serum-v1', 'INGREDIENT', '성분 만족도', '주요 성분과 사용 후 만족도가 좋았나요?', 7),
    ('serum-price', 'review-essence-serum-v1', 'PRICE', '가격 만족도', '가격 대비 품질과 효과가 만족스러웠나요?', 8),

    ('generic-effect', 'review-generic-v1', 'EFFECT', '기대 효능 만족도', '제품이 안내한 대표 기능을 사용하며 체감했나요?', 1),
    ('generic-texture', 'review-generic-v1', 'TEXTURE', '사용감', '제형과 마무리감이 일상에서 사용하기 편했나요?', 2),
    ('generic-low-irritation', 'review-generic-v1', 'LOW_IRRITATION', '자극 없음', '사용 후 따가움이나 붉어짐이 없었나요?', 3),
    ('generic-ingredient', 'review-generic-v1', 'INGREDIENT', '성분 만족도', '주요 성분과 사용 후 만족도가 좋았나요?', 4),
    ('generic-price', 'review-generic-v1', 'PRICE', '가격 만족도', '가격 대비 품질과 효과가 만족스러웠나요?', 5);
