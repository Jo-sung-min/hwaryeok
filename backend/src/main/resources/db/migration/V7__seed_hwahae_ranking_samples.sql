CREATE TABLE product_source_snapshots (
    product_id VARCHAR(64) PRIMARY KEY REFERENCES products (id) ON DELETE CASCADE,
    source_name VARCHAR(80) NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    source_product_id VARCHAR(40) NOT NULL,
    source_product_url VARCHAR(500) NOT NULL,
    source_rank INTEGER NOT NULL CHECK (source_rank > 0),
    source_rating NUMERIC(3, 2) NOT NULL CHECK (source_rating BETWEEN 0 AND 5),
    source_review_count INTEGER NOT NULL CHECK (source_review_count >= 0),
    package_info VARCHAR(80),
    source_updated_at DATE NOT NULL,
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    transformation VARCHAR(300) NOT NULL
);

CREATE INDEX idx_product_source_snapshots_rank ON product_source_snapshots (source_rank);
CREATE INDEX idx_product_source_snapshots_rating ON product_source_snapshots (source_rating DESC);

-- 화해 공개 급상승 랭킹(2026-08-13)의 사실 데이터만 사용합니다.
-- 화력 점수는 review_rating * 20을 반올림한 초기값이며, 효능/카테고리는 제품명 키워드만 규칙으로 변환했습니다.
INSERT INTO products (id, brand, name, category, base_score, benefit, sub_benefit, price, tone, tag) VALUES
    ('hwahae-2079267', '라운드랩', '자작나무 수분 앰플', '앰플', 92, '자작나무 수분 케어', '앰플 제형', 28000, 'blue', '화해 급상승 #1 · 평점 4.59'),
    ('hwahae-2170851', '션리', '알파나이아신 비타-토닝 레드 오일 마스크', '마스크팩', 90, '나이아신 피부 톤 케어', '마스크팩 제형', 4000, 'rose', '화해 급상승 #2 · 평점 4.48'),
    ('hwahae-2133830', '딕셔니스트', '아미노산 나이아신 선크림 [SPF50+/PA++++]', '선케어', 91, '자외선 차단', '나이아신 선케어', 25000, 'sand', '화해 급상승 #3 · 평점 4.56'),
    ('hwahae-1984011', '토리든', '다이브인 저분자 히알루론산 세럼', '세럼', 92, '히알루론산 수분 케어', '세럼 제형', 22000, 'peach', '화해 급상승 #5 · 평점 4.61'),
    ('hwahae-1899998', '플리프', '시카 알로에 스팟 젤', '젤', 89, '시카·알로에 진정', '젤 제형', 0, 'sage', '화해 급상승 #6 · 평점 4.46'),
    ('hwahae-1918760', '비플레인', '녹두 약산성 클렌징폼', '클렌저', 93, '약산성 세정', '클렌저 제형', 15000, 'sage', '화해 급상승 #7 · 평점 4.63'),
    ('hwahae-1950255', '에스네이처', '아쿠아 오아시스 토너', '토너', 95, '수분 토너', '토너 제형', 20000, 'blue', '화해 급상승 #8 · 평점 4.75'),
    ('hwahae-2078467', '에스트라', '아토베리어365 크림', '크림', 94, '보습 케어', '크림 제형', 33000, 'sand', '화해 급상승 #9 · 평점 4.68'),
    ('hwahae-1889139', '에스네이처', '아쿠아 스쿠알란 수분크림', '크림', 92, '스쿠알란 보습', '크림 제형', 28000, 'sand', '화해 급상승 #10 · 평점 4.58'),
    ('hwahae-1847019', '다자연', '어성초 케어 세럼', '세럼', 91, '어성초 진정', '세럼 제형', 20000, 'peach', '화해 급상승 #12 · 평점 4.55'),
    ('hwahae-1890897', '토리든', '다이브인 저분자 히알루론산 토너', '토너', 94, '히알루론산 수분 케어', '토너 제형', 21000, 'blue', '화해 급상승 #15 · 평점 4.71'),
    ('hwahae-1920665', '라운드랩', '자작나무 수분 선크림 [SPF50+/PA++++]', '선케어', 92, '자외선 차단', '자작나무 수분 선케어', 25000, 'sand', '화해 급상승 #16 · 평점 4.60'),
    ('hwahae-2015377', '다자연', '어성초 진정 수딩 크림', '크림', 94, '어성초 진정', '크림 제형', 18000, 'sand', '화해 급상승 #17 · 평점 4.68'),
    ('hwahae-1841507', '메이크프렘', '세이프 미 릴리프 모이스처 클렌징 밀크', '클렌저', 93, '부드러운 세정', '클렌저 제형', 24000, 'sage', '화해 급상승 #18 · 평점 4.66'),
    ('hwahae-2097676', '닥터지', '그린 딥 포어 클렌징 밤', '클렌저', 90, '부드러운 세정', '클렌저 제형', 24000, 'sage', '화해 급상승 #19 · 평점 4.49'),
    ('hwahae-2153055', '웰라쥬', '리얼 히알루로닉 블루 100 앰플', '앰플', 93, '히알루론산 수분 케어', '앰플 제형', 30000, 'blue', '화해 급상승 #20 · 평점 4.65');

INSERT INTO product_source_snapshots (
    product_id, source_name, source_url, source_product_id, source_product_url,
    source_rank, source_rating, source_review_count, package_info,
    source_updated_at, collected_at, transformation
) VALUES
    ('hwahae-2079267', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '2079267', 'https://www.hwahae.co.kr/products/2079267', 1, 4.59, 1393, '50ml', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-2170851', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '2170851', 'https://www.hwahae.co.kr/products/2170851', 2, 4.48, 69, '23 mL / 0.77 fl. oz.', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-2133830', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '2133830', 'https://www.hwahae.co.kr/products/2133830', 3, 4.56, 125, '45ml', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-1984011', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '1984011', 'https://www.hwahae.co.kr/products/1984011', 5, 4.61, 84960, '50ml / 1.69 fl. oz.', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-1899998', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '1899998', 'https://www.hwahae.co.kr/products/1899998', 6, 4.46, 26, '4.5g', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-1918760', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '1918760', 'https://www.hwahae.co.kr/products/1918760', 7, 4.63, 50044, '80ml', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-1950255', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '1950255', 'https://www.hwahae.co.kr/products/1950255', 8, 4.75, 28359, '210ml', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-2078467', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '2078467', 'https://www.hwahae.co.kr/products/2078467', 9, 4.68, 17975, '80ml', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-1889139', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '1889139', 'https://www.hwahae.co.kr/products/1889139', 10, 4.58, 42795, '60ml', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-1847019', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '1847019', 'https://www.hwahae.co.kr/products/1847019', 12, 4.55, 12728, '30ml', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-1890897', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '1890897', 'https://www.hwahae.co.kr/products/1890897', 15, 4.71, 35622, '300 ml / 10.14 fl. oz.', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-1920665', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '1920665', 'https://www.hwahae.co.kr/products/1920665', 16, 4.60, 29783, '50ml', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-2015377', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '2015377', 'https://www.hwahae.co.kr/products/2015377', 17, 4.68, 2760, '75ml', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-1841507', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '1841507', 'https://www.hwahae.co.kr/products/1841507', 18, 4.66, 8885, '200ml', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-2097676', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '2097676', 'https://www.hwahae.co.kr/products/2097676', 19, 4.49, 355, '100mL', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환'),
    ('hwahae-2153055', '화해 공개 급상승 랭킹', 'https://www.hwahae.co.kr/rankings', '2153055', 'https://www.hwahae.co.kr/products/2153055', 20, 4.65, 33624, '100ml', DATE '2026-08-13', TIMESTAMP WITH TIME ZONE '2026-08-13 06:00:00+00', '평점×20 반올림; 제품명 키워드 기반 카테고리·효능 변환');
