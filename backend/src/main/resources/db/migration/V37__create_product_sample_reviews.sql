CREATE TABLE product_sample_reviews (
    id VARCHAR(80) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL UNIQUE REFERENCES products (id) ON DELETE CASCADE,
    total_score NUMERIC(5, 2) NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    content VARCHAR(2000) NOT NULL,
    skin_type VARCHAR(40) NOT NULL,
    usage_period VARCHAR(30) NOT NULL,
    repurchase_yn BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_sample_reviews_created
    ON product_sample_reviews (created_at DESC, id ASC);

-- 화면 검증용 예시는 실제 회원 리뷰와 별도 테이블에 보관합니다.
-- 사용자 리뷰 수, 평균 점수, 제품/성분/리뷰어 랭킹 집계에는 포함되지 않습니다.
INSERT INTO product_sample_reviews (
    id, product_id, total_score, content, skin_type, usage_period, repurchase_yn
)
SELECT
    'sample:' || product.id,
    product.id,
    80.00,
    CASE
        WHEN product.category = '토너'
            THEN '세안 뒤 여러 번 덧발라도 부담이 적고 촉촉하게 정돈되는 사용감이었어요.'
        WHEN product.category IN ('세럼', '앰플', '에센스')
            THEN '소량으로도 부드럽게 펴 발리고 흡수된 뒤 피부가 편안하게 느껴졌어요.'
        WHEN product.category IN ('크림', '젤')
            THEN '마무리가 답답하지 않으면서 건조한 부위의 촉촉함이 오래 유지됐어요.'
        WHEN product.category IN ('선케어', '선크림')
            THEN '고르게 펴 바르기 쉽고 일상에서 부담 없이 덧바르기 좋은 사용감이었어요.'
        WHEN product.category IN ('클렌저', '클렌징폼')
            THEN '부드럽게 세정되고 헹군 뒤에도 피부가 과하게 당기지 않아 편안했어요.'
        WHEN product.category = '마스크팩'
            THEN '피부에 편안하게 밀착되고 사용 뒤 촉촉하고 산뜻한 느낌이 남았어요.'
        ELSE '제형이 편안하고 꾸준히 사용하기에 무리가 적은 제품으로 느껴졌어요.'
    END,
    CASE
        WHEN product.category IN ('크림', '젤') THEN '건성'
        WHEN product.category IN ('세럼', '앰플', '에센스') THEN '복합성'
        WHEN product.category IN ('클렌저', '클렌징폼') THEN '수부지'
        WHEN product.category IN ('선케어', '선크림') THEN '중성'
        ELSE '민감'
    END,
    'ONE_MONTH',
    TRUE
FROM products product;
