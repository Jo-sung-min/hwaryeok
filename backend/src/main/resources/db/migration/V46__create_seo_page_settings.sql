CREATE TABLE seo_page_settings (
    page_key VARCHAR(40) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(300) NOT NULL,
    indexable BOOLEAN NOT NULL DEFAULT TRUE,
    follow_links BOOLEAN NOT NULL DEFAULT TRUE,
    og_title VARCHAR(100) NOT NULL,
    og_description VARCHAR(300) NOT NULL,
    og_image_url VARCHAR(500),
    include_in_sitemap BOOLEAN NOT NULL DEFAULT TRUE,
    sitemap_change_frequency VARCHAR(20) NOT NULL,
    sitemap_priority NUMERIC(3, 2) NOT NULL,
    updated_by VARCHAR(36) REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_seo_page_settings_change_frequency
        CHECK (sitemap_change_frequency IN ('ALWAYS', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'NEVER')),
    CONSTRAINT chk_seo_page_settings_priority
        CHECK (sitemap_priority >= 0 AND sitemap_priority <= 1),
    CONSTRAINT chk_seo_page_settings_sitemap_indexable
        CHECK (NOT include_in_sitemap OR indexable)
);

CREATE TABLE seo_page_keywords (
    page_key VARCHAR(40) NOT NULL REFERENCES seo_page_settings (page_key) ON DELETE CASCADE,
    display_order INTEGER NOT NULL CHECK (display_order BETWEEN 0 AND 19),
    keyword VARCHAR(60) NOT NULL,
    PRIMARY KEY (page_key, display_order),
    UNIQUE (page_key, keyword)
);

INSERT INTO seo_page_settings (
    page_key, title, description, indexable, follow_links,
    og_title, og_description, og_image_url,
    include_in_sitemap, sitemap_change_frequency, sitemap_priority
) VALUES
    ('HOME', '화력 | 화장품의 기준을, 내 피부로',
     '내 피부 설정에 따라 달라지는 화장품 랭킹. 나에게 맞는 성분을 찾고, 맞춤 화력과 추천 이유를 비교하세요.',
     TRUE, TRUE, '화력 | 화장품의 기준을, 내 피부로',
     '내 피부 설정에 따라 달라지는 화장품 랭킹. 나에게 맞는 성분을 찾고, 맞춤 화력과 추천 이유를 비교하세요.',
     '/hero-watercolor.png', TRUE, 'DAILY', 1.00),
    ('PRODUCTS', '화장품 탐색 | 화력',
     '제품명과 브랜드뿐 아니라 주름, 모공, 트러블 같은 피부 고민으로 성분 근거가 연결된 화장품을 찾아보세요.',
     TRUE, TRUE, '화장품 탐색 | 화력',
     '제품명과 브랜드뿐 아니라 주름, 모공, 트러블 같은 피부 고민으로 성분 근거가 연결된 화장품을 찾아보세요.',
     '/hero-watercolor.png', TRUE, 'WEEKLY', 0.70),
    ('PROMOTIONS', '화력 추천 | 화력',
     '화력 관리자가 평가한 신생 화장품 광고와 추천 이유를 투명하게 확인하세요.',
     TRUE, TRUE, '화력 추천 | 화력',
     '화력 관리자가 평가한 신생 화장품 광고와 추천 이유를 투명하게 확인하세요.',
     '/hero-watercolor.png', TRUE, 'WEEKLY', 0.70),
    ('RANKING', '성분별 제품 랭킹 | 화력',
     '히알루론산, 판테놀, 나이아신아마이드 등 관심 성분별로 앰플·세럼·크림을 비교하고 성분 화력순과 사용자 리뷰점수순으로 확인하세요.',
     TRUE, TRUE, '성분별 제품 랭킹 | 화력',
     '히알루론산, 판테놀, 나이아신아마이드 등 관심 성분별로 앰플·세럼·크림을 비교하고 성분 화력순과 사용자 리뷰점수순으로 확인하세요.',
     '/hero-watercolor.png', TRUE, 'WEEKLY', 0.70),
    ('COMPARE', '제품 비교 | 화력',
     '화장품 2~3개를 같은 피부 조건과 세부 화력 기준으로 나란히 비교하세요.',
     TRUE, TRUE, '제품 비교 | 화력',
     '화장품 2~3개를 같은 피부 조건과 세부 화력 기준으로 나란히 비교하세요.',
     '/hero-watercolor.png', TRUE, 'WEEKLY', 0.70),
    ('INGREDIENTS', '성분 사전 | 화력',
     '화장품 성분의 역할과 피부별 특징을 알아보고, 성분별 제품 랭킹으로 이어서 탐색하세요.',
     TRUE, TRUE, '성분 사전 | 화력',
     '화장품 성분의 역할과 피부별 특징을 알아보고, 성분별 제품 랭킹으로 이어서 탐색하세요.',
     '/hero-watercolor.png', TRUE, 'WEEKLY', 0.70),
    ('EXPERTS', '전문가 활동 | 화력',
     '인증 정보를 분리해 공개하는 의료진의 화장품·성분 답변과 플랫폼 활동을 확인하세요.',
     TRUE, TRUE, '전문가 활동 | 화력',
     '인증 정보를 분리해 공개하는 의료진의 화장품·성분 답변과 플랫폼 활동을 확인하세요.',
     '/hero-watercolor.png', TRUE, 'WEEKLY', 0.70),
    ('EXPERT_RANKING', '전문가 활동 랭킹 | 화력',
     '화력 안에서 질문에 답하고 유용한 정보를 나눈 인증 전문가의 활동을 기간과 주제별로 확인하세요.',
     TRUE, TRUE, '전문가 활동 랭킹 | 화력',
     '화력 안에서 질문에 답하고 유용한 정보를 나눈 인증 전문가의 활동을 기간과 주제별로 확인하세요.',
     '/hero-watercolor.png', TRUE, 'WEEKLY', 0.70),
    ('QUESTIONS', '화장품 고민 상담소 | 화력',
     '화장품과 성분에 관한 사용자 질문과 인증 전문가의 공개 답변을 살펴보세요.',
     TRUE, TRUE, '화장품 고민 상담소 | 화력',
     '화장품과 성분에 관한 사용자 질문과 인증 전문가의 공개 답변을 살펴보세요.',
     '/hero-watercolor.png', TRUE, 'WEEKLY', 0.70),
    ('REVIEWERS', '리뷰어 랭킹 · 리뷰 화력 | 화력',
     '사용자들이 평가한 리뷰 화력순으로 리뷰어를 만나보세요. 피부타입과 실제 작성 리뷰를 함께 확인할 수 있어요.',
     TRUE, TRUE, '리뷰어 랭킹 · 리뷰 화력 | 화력',
     '사용자들이 평가한 리뷰 화력순으로 리뷰어를 만나보세요. 피부타입과 실제 작성 리뷰를 함께 확인할 수 있어요.',
     '/hero-watercolor.png', FALSE, 'WEEKLY', 0.60),
    ('PRINCIPLES', '성분 랭킹의 기준 | 화력',
     '성분과 제품 종류를 고르고, 성분 화력순과 사용자 리뷰순으로 화장품 랭킹을 읽는 방법을 알아보세요.',
     TRUE, TRUE, '성분 랭킹의 기준 | 화력',
     '성분과 제품 종류를 고르고, 성분 화력순과 사용자 리뷰순으로 화장품 랭킹을 읽는 방법을 알아보세요.',
     '/hero-watercolor.png', TRUE, 'WEEKLY', 0.70),
    ('SKIN_CHECK', '나의 성분찾기 | 화력',
     '피부 상태와 생활 습관, 잘 맞았던 성분을 함께 살펴보고 나의 피부 경향과 맞춤 성분을 확인하세요.',
     TRUE, TRUE, '나의 성분찾기 | 화력',
     '피부 상태와 생활 습관, 잘 맞았던 성분을 함께 살펴보고 나의 피부 경향과 맞춤 성분을 확인하세요.',
     '/hero-watercolor.png', FALSE, 'MONTHLY', 0.50),
    ('RISING_RANKING', '급상승 제품 랭킹 | 화력',
     '최근 7일 동안 사용자 리뷰가 더 많이 모인 화장품을 카테고리별로 확인하세요. 직전 7일 대비 리뷰 증가 수로 집계해요.',
     TRUE, TRUE, '급상승 제품 랭킹 | 화력',
     '최근 7일 동안 사용자 리뷰가 더 많이 모인 화장품을 카테고리별로 확인하세요. 직전 7일 대비 리뷰 증가 수로 집계해요.',
     '/hero-watercolor.png', FALSE, 'WEEKLY', 0.70);

INSERT INTO seo_page_keywords (page_key, display_order, keyword)
SELECT setting.page_key, keyword_seed.display_order, keyword_seed.keyword
FROM seo_page_settings setting
CROSS JOIN (
    SELECT 0 AS display_order, '화장품 랭킹' AS keyword
    UNION ALL SELECT 1, '성분 랭킹'
    UNION ALL SELECT 2, '히알루론산'
    UNION ALL SELECT 3, '세라마이드'
    UNION ALL SELECT 4, '화장품 리뷰'
    UNION ALL SELECT 5, '화장품 비교'
) keyword_seed;
