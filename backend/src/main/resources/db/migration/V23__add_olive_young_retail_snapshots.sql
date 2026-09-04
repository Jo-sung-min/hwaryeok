CREATE TABLE product_retail_snapshots (
    product_id VARCHAR(64) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    retailer VARCHAR(40) NOT NULL,
    retailer_product_id VARCHAR(80) NOT NULL,
    retailer_product_name VARCHAR(300) NOT NULL,
    retailer_url VARCHAR(500) NOT NULL,
    package_info VARCHAR(200) NOT NULL,
    regular_price INTEGER NOT NULL CHECK (regular_price >= 0),
    sale_price INTEGER CHECK (sale_price >= 0),
    availability VARCHAR(20) NOT NULL CHECK (availability IN ('AVAILABLE', 'SOLD_OUT')),
    checked_at DATE NOT NULL,
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(300)
);

INSERT INTO product_retail_snapshots (
    product_id, retailer, retailer_product_id, retailer_product_name, retailer_url,
    package_info, regular_price, sale_price, availability, checked_at, collected_at, notes
) VALUES
    ('heartleaf-toner', 'OLIVE_YOUNG', 'A000000243621', '아누아 어성초 77 히알루론 수분 진정 토너 250ml 더블 기획', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000243621', '250ml × 2', 37500, 24000, 'SOLD_OUT', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '250ml 본품과 같은 라인의 더블 기획 상품'),
    ('birch-cream', 'OLIVE_YOUNG', 'A000000263179', '라운드랩 자작나무 수분 크림 80ml 더블 기획 (+자작 드롭 세럼 20ml)', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000263179', '80ml × 2 + 세럼 20ml', 48000, 24000, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '본품 2개와 증정품이 포함된 기획 상품'),
    ('bean-essence', 'OLIVE_YOUNG', 'A000000263031', '믹순 콩 에센스 50ml 기획 (+콩 에센스 1.5ml*6ea + 콩 크림 15ml)', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000263031', '50ml + 1.5ml × 6 + 크림 15ml', 35000, 23760, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '증정품이 포함된 기획 상품'),
    ('rice-sunscreen', 'OLIVE_YOUNG', 'A000000224657', '조선미녀 맑은쌀 선크림 50ml+20ml 증정 기획', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000224657', '50ml + 20ml', 20000, 13500, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '20ml 증정품이 포함된 기획 상품'),
    ('hwahae-1841507', 'OLIVE_YOUNG', 'A000000136849', '메이크프렘 세이프 미 릴리프 모이스처 클렌징 밀크 200ml', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000136849', '200ml', 24000, 17100, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '동일 용량 단품'),
    ('hwahae-1889139', 'OLIVE_YOUNG', 'A000000156230', '에스네이처 아쿠아 스쿠알란 수분크림 60ml 기획 (+크림 30ml)', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000156230', '60ml + 크림 30ml', 28000, 17010, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '증정품이 포함된 기획 상품'),
    ('hwahae-1890897', 'OLIVE_YOUNG', 'A000000258293', '토리든 다이브인 저분자 히알루론산 토너 300ml 기획 (+100ml)', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000258293', '300ml + 100ml', 21000, 14760, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '100ml 증정품이 포함된 기획 상품'),
    ('hwahae-1918760', 'OLIVE_YOUNG', 'A000000142520', '비플레인 녹두 약산성 클렌징폼 80ml', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000142520', '80ml', 13800, 10580, 'SOLD_OUT', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '동일 용량 단품'),
    ('hwahae-1920665', 'OLIVE_YOUNG', 'A000000149135', '라운드랩 자작나무 수분 선크림 50ml 기획(+크림 20ml)', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000149135', '50ml + 크림 20ml', 25000, 16630, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '증정품이 포함된 기획 상품'),
    ('hwahae-1950255', 'OLIVE_YOUNG', 'A000000264152', '에스네이처 아쿠아 오아시스 토너 300ml 기획 (+크림 30ml+헬로키티 말랑스티커)', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000264152', '300ml + 크림 30ml', 25000, 16900, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '증정품이 포함된 기획 상품'),
    ('hwahae-1984011', 'OLIVE_YOUNG', 'A000000258297', '토리든 다이브인 저분자 히알루론산 세럼 50ml 기획 (+멀티 패드 10매)', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000258297', '50ml + 패드 10매', 22000, 15680, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '증정품이 포함된 기획 상품'),
    ('hwahae-2078467', 'OLIVE_YOUNG', 'A000000198320', '[올영 어워즈 1등 크림] 에스트라 아토베리어365 크림 80ml', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000198320', '80ml', 33000, 24950, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '동일 용량 단품'),
    ('hwahae-2079267', 'OLIVE_YOUNG', 'A000000197362', '라운드랩 자작나무 수분 앰플 50ml 기획 (+크림 20ml)', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000197362', '50ml + 크림 20ml', 28000, 15550, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '증정품이 포함된 기획 상품'),
    ('hwahae-2097676', 'OLIVE_YOUNG', 'A000000207640', '닥터지 그린딥 포어 클렌징밤 100ml', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000207640', '100ml', 24000, 13500, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '동일 용량 단품'),
    ('hwahae-2153055', 'OLIVE_YOUNG', 'A000000231884', '웰라쥬 리얼 히알루로닉 블루 100 앰플 100ml 기획 (+원데이키트2ea)', 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000231884', '100ml + 원데이키트 2개', 30000, 22560, 'AVAILABLE', DATE '2026-09-04', TIMESTAMP WITH TIME ZONE '2026-09-04 06:00:00+00', '증정품이 포함된 기획 상품');

UPDATE products p
SET source_url = s.retailer_url,
    source_checked_at = s.checked_at
FROM product_retail_snapshots s
WHERE p.id = s.product_id;

-- 동일 용량의 단품 또는 본품 정가가 명확히 확인된 항목만 기본 가격을 보정한다.
UPDATE products SET price = 20000 WHERE id = 'rice-sunscreen';
UPDATE products SET price = 13800 WHERE id = 'hwahae-1918760';
UPDATE products SET price = 25000 WHERE id = 'hwahae-1950255';
