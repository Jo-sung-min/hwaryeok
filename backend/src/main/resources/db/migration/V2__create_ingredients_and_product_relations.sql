CREATE TABLE ingredients (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    english_name VARCHAR(160) NOT NULL,
    role VARCHAR(120) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('GOOD', 'CAUTION', 'NEUTRAL')),
    caution VARCHAR(600)
);

CREATE TABLE ingredient_tags (
    ingredient_id VARCHAR(64) NOT NULL REFERENCES ingredients (id) ON DELETE CASCADE,
    tag VARCHAR(40) NOT NULL,
    PRIMARY KEY (ingredient_id, tag)
);

CREATE TABLE ingredient_skin_type_features (
    ingredient_id VARCHAR(64) NOT NULL REFERENCES ingredients (id) ON DELETE CASCADE,
    skin_type VARCHAR(40) NOT NULL,
    feature VARCHAR(600) NOT NULL,
    PRIMARY KEY (ingredient_id, skin_type)
);

CREATE TABLE ingredient_concern_features (
    ingredient_id VARCHAR(64) NOT NULL REFERENCES ingredients (id) ON DELETE CASCADE,
    concern VARCHAR(40) NOT NULL,
    feature VARCHAR(600) NOT NULL,
    PRIMARY KEY (ingredient_id, concern)
);

CREATE TABLE product_ingredients (
    product_id VARCHAR(64) NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    ingredient_id VARCHAR(64) NOT NULL REFERENCES ingredients (id) ON DELETE RESTRICT,
    display_order INTEGER NOT NULL CHECK (display_order > 0),
    concentration_note VARCHAR(100),
    PRIMARY KEY (product_id, ingredient_id),
    UNIQUE (product_id, display_order)
);

CREATE INDEX idx_ingredients_status ON ingredients (status);
CREATE INDEX idx_ingredient_tags_tag ON ingredient_tags (tag);
CREATE INDEX idx_product_ingredients_ingredient ON product_ingredients (ingredient_id);

-- 신규 DB에서도 제품-성분 외래 키를 만들 수 있도록 기준 제품을 먼저 보장합니다.
INSERT INTO products (id, brand, name, category, base_score, benefit, sub_benefit, price, tone, tag) VALUES
    ('birch-cream', '라운드랩', '자작나무 수분 크림', '크림', 94, '수분 장벽 강화', '속건조 보습', 32000, 'blue', '민감 피부 1위'),
    ('heartleaf-toner', '아누아', '어성초 77 진정 토너', '토너', 91, '붉은기 진정', '유수분 균형', 25000, 'sage', '요즘 많이 봐요'),
    ('ceramide-serum', '아뜰리에 온', '세라마이드 결 세럼', '세럼', 90, '장벽 케어', '결 정돈', 38000, 'peach', '신규 등록'),
    ('rice-sunscreen', '조선미녀', '맑은 쌀 선크림', '선케어', 86, '순한 자외선 차단', '촉촉한 보습', 18000, 'sand', NULL),
    ('mugwort-ampoule', '아임프롬', '강화 약쑥 앰플', '앰플', 84, '열감 진정', '민감 케어', 39000, 'rose', NULL),
    ('bean-essence', '믹순', '콩 에센스', '에센스', 82, '피부결 개선', '보습', 35000, 'sand', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (id, name, english_name, role, description, status, caution) VALUES
    ('birch-sap', '자작나무 수액', 'Betula Platyphylla Japonica Juice', '수분 충전', '건조해진 피부에 가볍게 수분을 채우고 편안한 사용감을 주는 성분이에요.', 'GOOD', NULL),
    ('panthenol', '판테놀', 'Panthenol', '진정 · 장벽', '피부를 편안하게 다독이고 수분 손실을 줄이는 데 도움을 주는 프로비타민 B5 성분이에요.', 'GOOD', NULL),
    ('hyaluronic-acid', '히알루론산', 'Hyaluronic Acid', '보습', '수분을 끌어당겨 피부가 촉촉함을 유지하도록 돕는 대표적인 보습 성분이에요.', 'GOOD', NULL),
    ('shea-butter', '시어버터', 'Butyrospermum Parkii Butter', '보습막', '피부 표면에 부드러운 보습막을 만들어 건조함을 줄이는 식물성 오일 성분이에요.', 'CAUTION', '유분이 많은 피부는 더운 계절에 답답함을 느낄 수 있어 소량부터 사용해보세요.'),
    ('heartleaf', '어성초 추출물', 'Houttuynia Cordata Extract', '진정', '붉고 예민해진 피부를 편안하게 관리하는 데 자주 사용되는 식물 추출물이에요.', 'GOOD', NULL),
    ('ceramide-np', '세라마이드 NP', 'Ceramide NP', '피부 장벽 · 보습', '피부 장벽을 구성하는 지질과 유사해 수분이 빠져나가지 않도록 돕는 성분이에요.', 'GOOD', NULL),
    ('rice-extract', '쌀 추출물', 'Oryza Sativa Rice Extract', '보습 · 피부 톤', '피부에 수분과 영양을 보충하고 맑은 인상을 유지하도록 돕는 성분이에요.', 'GOOD', NULL),
    ('mugwort-extract', '약쑥 추출물', 'Artemisia Princeps Extract', '열감 진정', '열감과 외부 자극으로 불편한 피부를 부드럽게 진정시키는 데 도움을 줘요.', 'GOOD', NULL),
    ('soybean-ferment', '콩 발효 추출물', 'Lactobacillus Soybean Ferment Extract', '피부결 · 보습', '묵은 각질로 거칠어진 피부결을 부드럽게 정돈하고 촉촉함을 더해줘요.', 'GOOD', NULL),
    ('niacinamide', '나이아신아마이드', 'Niacinamide', '피부 톤 · 장벽', '피부 톤과 장벽, 유분 균형을 폭넓게 관리하는 다재다능한 비타민 B3 성분이에요.', 'GOOD', '고함량 제품을 처음 사용할 때는 피부 상태를 살피며 천천히 적응해보세요.'),
    ('ethanol', '에탄올', 'Alcohol', '사용감 · 용매', '제형을 산뜻하게 하고 다른 성분이 고르게 섞이도록 돕는 용매 성분이에요.', 'CAUTION', '건조하거나 예민한 피부는 따가움이나 당김을 느낄 수 있어 사용 전 확인이 필요해요.');

INSERT INTO ingredient_tags (ingredient_id, tag) VALUES
    ('birch-sap', '보습'), ('birch-sap', '진정'),
    ('panthenol', '진정'), ('panthenol', '장벽'), ('panthenol', '보습'),
    ('hyaluronic-acid', '보습'),
    ('shea-butter', '보습'), ('shea-butter', '유분'),
    ('heartleaf', '진정'), ('heartleaf', '붉은기'),
    ('ceramide-np', '장벽'), ('ceramide-np', '보습'),
    ('rice-extract', '보습'), ('rice-extract', '피부톤'),
    ('mugwort-extract', '진정'), ('mugwort-extract', '열감'),
    ('soybean-ferment', '각질'), ('soybean-ferment', '보습'),
    ('niacinamide', '피부톤'), ('niacinamide', '장벽'), ('niacinamide', '유분균형'),
    ('ethanol', '주의');

INSERT INTO ingredient_skin_type_features (ingredient_id, skin_type, feature) VALUES
    ('birch-sap', '건성', '가볍게 수분을 채워 당김을 줄이는 데 도움이 될 수 있어요.'),
    ('birch-sap', '수부지', '무거운 유분감 없이 수분을 보충하기 좋아요.'),
    ('panthenol', '민감', '예민한 날 피부를 편안하게 하고 장벽 관리를 도와요.'),
    ('panthenol', '건성', '수분 손실을 줄여 건조함을 완화하는 데 도움을 줘요.'),
    ('hyaluronic-acid', '건성', '수분을 끌어당겨 건조한 피부의 촉촉함을 유지해요.'),
    ('hyaluronic-acid', '지성', '오일 부담 없이 수분을 보충할 수 있어요.'),
    ('shea-butter', '건성', '보습막이 필요한 매우 건조한 피부에 든든한 편이에요.'),
    ('shea-butter', '지성', '많이 바르면 무겁게 느껴질 수 있어 양 조절이 필요해요.'),
    ('heartleaf', '민감', '붉고 예민한 피부를 편안하게 다독이는 데 도움을 줘요.'),
    ('ceramide-np', '건성', '부족한 피부 지질을 보완해 장벽과 보습을 함께 챙겨요.'),
    ('ceramide-np', '민감', '약해진 장벽을 건강하게 유지하는 데 도움을 줄 수 있어요.'),
    ('rice-extract', '건성', '부드러운 보습과 영양을 함께 보충하기 좋아요.'),
    ('mugwort-extract', '민감', '열감과 외부 자극으로 불편한 피부를 진정시키는 데 도움을 줘요.'),
    ('soybean-ferment', '복합성', '거친 피부결을 정돈하면서 수분을 보충해요.'),
    ('niacinamide', '지성', '유분 균형과 피부 톤을 함께 관리하기 좋아요.'),
    ('niacinamide', '민감', '처음에는 낮은 함량부터 피부 반응을 살펴보는 편이 좋아요.'),
    ('ethanol', '민감', '따가움이나 붉어짐이 생길 수 있어 주의가 필요해요.'),
    ('ethanol', '건성', '수분이 빠르게 날아가 당김을 느낄 수 있어요.');

INSERT INTO ingredient_concern_features (ingredient_id, concern, feature) VALUES
    ('birch-sap', '속건조', '피부 안쪽이 당기는 느낌을 줄이도록 수분 보충을 도와요.'),
    ('panthenol', '피부 장벽', '수분 손실을 줄이고 장벽이 편안하게 회복되도록 도와요.'),
    ('panthenol', '민감', '자극받은 피부를 편안하게 관리하는 데 유용해요.'),
    ('hyaluronic-acid', '속건조', '수분을 끌어당겨 오랫동안 촉촉함을 유지하도록 도와요.'),
    ('shea-butter', '속건조', '수분이 날아가지 않도록 보습막을 형성해요.'),
    ('heartleaf', '붉은기', '열감과 함께 나타나는 붉은기를 편안하게 관리해요.'),
    ('ceramide-np', '피부 장벽', '피부 지질을 보완해 약해진 장벽 관리에 도움을 줘요.'),
    ('rice-extract', '칙칙함', '건조해 칙칙해 보이는 피부를 촉촉하고 맑게 관리해요.'),
    ('mugwort-extract', '붉은기', '열감으로 붉어진 피부를 편안하게 진정시켜요.'),
    ('soybean-ferment', '각질', '거칠게 들뜬 묵은 각질을 부드럽게 정돈해요.'),
    ('niacinamide', '칙칙함', '고르지 않은 피부 톤을 맑게 관리하는 데 도움을 줘요.'),
    ('niacinamide', '모공', '유분 균형을 관리해 모공이 도드라져 보이는 것을 줄이는 데 도움을 줘요.'),
    ('ethanol', '민감', '피부 컨디션이 낮은 날에는 자극으로 느껴질 수 있어요.');

INSERT INTO product_ingredients (product_id, ingredient_id, display_order, concentration_note) VALUES
    ('birch-cream', 'birch-sap', 1, '핵심 성분'), ('birch-cream', 'panthenol', 2, '진정 보조'), ('birch-cream', 'hyaluronic-acid', 3, '수분 유지'), ('birch-cream', 'shea-butter', 4, '보습막'),
    ('heartleaf-toner', 'heartleaf', 1, '핵심 성분'), ('heartleaf-toner', 'panthenol', 2, '진정 보조'), ('heartleaf-toner', 'hyaluronic-acid', 3, '수분 유지'), ('heartleaf-toner', 'niacinamide', 4, '피부 톤 보조'),
    ('ceramide-serum', 'ceramide-np', 1, '핵심 성분'), ('ceramide-serum', 'panthenol', 2, '장벽 보조'), ('ceramide-serum', 'hyaluronic-acid', 3, '수분 유지'), ('ceramide-serum', 'shea-butter', 4, '보습막'),
    ('rice-sunscreen', 'rice-extract', 1, '핵심 성분'), ('rice-sunscreen', 'niacinamide', 2, '피부 톤 보조'), ('rice-sunscreen', 'panthenol', 3, '진정 보조'), ('rice-sunscreen', 'ethanol', 4, '사용감 보조'),
    ('mugwort-ampoule', 'mugwort-extract', 1, '핵심 성분'), ('mugwort-ampoule', 'panthenol', 2, '진정 보조'), ('mugwort-ampoule', 'heartleaf', 3, '붉은기 진정'),
    ('bean-essence', 'soybean-ferment', 1, '핵심 성분'), ('bean-essence', 'niacinamide', 2, '피부 톤 보조'), ('bean-essence', 'hyaluronic-acid', 3, '수분 유지');
