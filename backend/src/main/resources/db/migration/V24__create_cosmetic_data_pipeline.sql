CREATE TABLE cosmetic_data_sources (
    id VARCHAR(40) PRIMARY KEY,
    display_name VARCHAR(120) NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    terms_url VARCHAR(500),
    ingestion_mode VARCHAR(30) NOT NULL CHECK (ingestion_mode IN ('API', 'LICENSED_FILE', 'ADMIN_VERIFIED_URL', 'INTERNAL_SEED')),
    usage_note VARCHAR(700) NOT NULL,
    priority INTEGER NOT NULL CHECK (priority > 0)
);

INSERT INTO cosmetic_data_sources (id, display_name, source_url, terms_url, ingestion_mode, usage_note, priority) VALUES
    ('MFDS_FUNCTIONAL', '식품의약품안전처 기능성화장품 보고품목정보', 'https://www.data.go.kr/data/15095680/openapi.do', 'https://www.data.go.kr/tcs/eds/selectCoreDataView.do', 'API', '공공데이터포털에서 발급한 인증키와 활용신청된 API 주소로 동기화합니다.', 10),
    ('MFDS_RESTRICTED', '식품의약품안전처 화장품 사용제한 원료정보', 'https://www.data.go.kr/data/15111772/openapi.do', 'https://www.data.go.kr/tcs/eds/selectCoreDataView.do', 'API', '표준명과 제한사항을 안전성 참고정보로 적재하며 사용 가능 여부를 단독 판정하지 않습니다.', 20),
    ('KCIA_DICTIONARY', '대한화장품협회 화장품 성분사전', 'https://kcia.or.kr/cid/search/ingd_list.php', 'https://kcia.or.kr/cid/about/intro_03.php', 'LICENSED_FILE', '협회의 이용조건과 사용권을 확인한 공식 CSV/XLSX 파일만 관리자가 업로드합니다.', 30),
    ('BRAND_OFFICIAL', '브랜드 공식 제품 페이지', 'https://hwaryeok.local/admin/products', NULL, 'ADMIN_VERIFIED_URL', '관리자가 공식 도메인과 전성분 원문을 확인한 뒤 제품별로 등록합니다.', 40),
    ('LEGACY_CURATED', '화력 기존 검수 성분', 'https://hwaryeok.local/', NULL, 'INTERNAL_SEED', '기존에 검수해 운영하던 성분을 신규 표준사전과 연결하기 위한 내부 기준입니다.', 90);

CREATE TABLE cosmetic_ingestion_runs (
    id VARCHAR(36) PRIMARY KEY,
    source_id VARCHAR(40) NOT NULL REFERENCES cosmetic_data_sources(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('RUNNING', 'SUCCEEDED', 'FAILED')),
    file_name VARCHAR(255),
    records_read INTEGER NOT NULL DEFAULT 0 CHECK (records_read >= 0),
    records_upserted INTEGER NOT NULL DEFAULT 0 CHECK (records_upserted >= 0),
    records_skipped INTEGER NOT NULL DEFAULT 0 CHECK (records_skipped >= 0),
    error_message VARCHAR(700),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_cosmetic_ingestion_runs_source_started
    ON cosmetic_ingestion_runs (source_id, started_at DESC);

CREATE TABLE cosmetic_ingredient_references (
    source_id VARCHAR(40) NOT NULL REFERENCES cosmetic_data_sources(id) ON DELETE RESTRICT,
    source_ingredient_id VARCHAR(120) NOT NULL,
    standard_name VARCHAR(300) NOT NULL,
    normalized_name VARCHAR(300) NOT NULL,
    english_name VARCHAR(500),
    cas_no VARCHAR(200),
    former_name VARCHAR(500),
    source_updated_at DATE,
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    raw_source_row TEXT,
    PRIMARY KEY (source_id, source_ingredient_id)
);

CREATE INDEX idx_cosmetic_ingredient_references_normalized
    ON cosmetic_ingredient_references (normalized_name);
CREATE INDEX idx_cosmetic_ingredient_references_cas
    ON cosmetic_ingredient_references (cas_no);

CREATE TABLE cosmetic_ingredient_aliases (
    source_id VARCHAR(40) NOT NULL,
    source_ingredient_id VARCHAR(120) NOT NULL,
    alias VARCHAR(500) NOT NULL,
    normalized_alias VARCHAR(300) NOT NULL,
    alias_type VARCHAR(20) NOT NULL CHECK (alias_type IN ('STANDARD', 'ENGLISH', 'FORMER')),
    PRIMARY KEY (source_id, source_ingredient_id, normalized_alias),
    FOREIGN KEY (source_id, source_ingredient_id)
        REFERENCES cosmetic_ingredient_references(source_id, source_ingredient_id) ON DELETE CASCADE
);

CREATE INDEX idx_cosmetic_ingredient_aliases_lookup
    ON cosmetic_ingredient_aliases (normalized_alias, source_id);

CREATE TABLE mfds_cosmetic_products (
    report_id VARCHAR(120) PRIMARY KEY,
    product_name VARCHAR(500) NOT NULL,
    normalized_product_name VARCHAR(500) NOT NULL,
    company_name VARCHAR(300),
    manufacturer_name VARCHAR(300),
    functional_types VARCHAR(1000),
    report_date DATE,
    source_url VARCHAR(500) NOT NULL,
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    raw_payload TEXT NOT NULL
);

CREATE INDEX idx_mfds_cosmetic_products_name
    ON mfds_cosmetic_products (normalized_product_name);

CREATE TABLE mfds_ingredient_regulations (
    source_record_id VARCHAR(120) PRIMARY KEY,
    standard_name VARCHAR(500) NOT NULL,
    normalized_name VARCHAR(500) NOT NULL,
    english_name VARCHAR(500),
    cas_no VARCHAR(200),
    restriction_type VARCHAR(200),
    restriction_text VARCHAR(2000),
    proviso VARCHAR(2000),
    source_url VARCHAR(500) NOT NULL,
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    raw_payload TEXT NOT NULL
);

CREATE INDEX idx_mfds_ingredient_regulations_name
    ON mfds_ingredient_regulations (normalized_name);

CREATE TABLE mfds_product_matches (
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    report_id VARCHAR(120) NOT NULL REFERENCES mfds_cosmetic_products(report_id) ON DELETE CASCADE,
    match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('AUTO_EXACT', 'ADMIN_VERIFIED')),
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    matched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, report_id)
);

CREATE TABLE product_ingredient_sources (
    product_id VARCHAR(64) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    source_type VARCHAR(30) NOT NULL CHECK (source_type = 'BRAND_OFFICIAL'),
    source_url VARCHAR(500) NOT NULL,
    source_domain VARCHAR(253) NOT NULL,
    page_title VARCHAR(300) NOT NULL,
    raw_ingredient_text TEXT NOT NULL,
    total_ingredient_count INTEGER NOT NULL CHECK (total_ingredient_count >= 0),
    matched_ingredient_count INTEGER NOT NULL CHECK (matched_ingredient_count >= 0),
    unmatched_ingredients TEXT,
    verification_status VARCHAR(20) NOT NULL CHECK (verification_status IN ('VERIFIED', 'PARTIAL', 'UNMATCHED')),
    published BOOLEAN NOT NULL DEFAULT FALSE,
    checked_at DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (matched_ingredient_count <= total_ingredient_count)
);

-- 기존 검수 성분도 동일한 이름 정규화·매칭 파이프라인에서 사용할 수 있게 초기 적재합니다.
INSERT INTO cosmetic_ingredient_references (
    source_id, source_ingredient_id, standard_name, normalized_name, english_name,
    collected_at, raw_source_row
)
SELECT
    'LEGACY_CURATED', id, name, LOWER(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', ''), '-', ''), '·', ''), '/', '')),
    NULLIF(english_name, ''), CURRENT_TIMESTAMP, '기존 화력 검수 성분'
FROM ingredients;

INSERT INTO cosmetic_ingredient_aliases (
    source_id, source_ingredient_id, alias, normalized_alias, alias_type
)
SELECT
    'LEGACY_CURATED', id, name,
    LOWER(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', ''), '-', ''), '·', ''), '/', '')),
    'STANDARD'
FROM ingredients;

INSERT INTO cosmetic_ingredient_aliases (
    source_id, source_ingredient_id, alias, normalized_alias, alias_type
)
SELECT
    'LEGACY_CURATED', id, english_name,
    LOWER(REPLACE(REPLACE(REPLACE(REPLACE(english_name, ' ', ''), '-', ''), '·', ''), '/', '')),
    'ENGLISH'
FROM ingredients
WHERE english_name <> '';
