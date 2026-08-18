CREATE TABLE experts (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(80) NOT NULL UNIQUE,
    user_id VARCHAR(36) UNIQUE REFERENCES users (id) ON DELETE SET NULL,
    real_name VARCHAR(80) NOT NULL,
    license_number_hash VARCHAR(64) NOT NULL UNIQUE,
    doctor_verified BOOLEAN NOT NULL DEFAULT FALSE,
    doctor_verified_at TIMESTAMP WITH TIME ZONE,
    specialist_verified BOOLEAN NOT NULL DEFAULT FALSE,
    specialty VARCHAR(100),
    workplace_verified BOOLEAN NOT NULL DEFAULT FALSE,
    workplace_verified_at TIMESTAMP WITH TIME ZONE,
    profile_image_url VARCHAR(500),
    bio VARCHAR(1000) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_experts_status CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'))
);

CREATE TABLE expert_workplaces (
    id VARCHAR(36) PRIMARY KEY,
    expert_id VARCHAR(36) NOT NULL REFERENCES experts (id) ON DELETE CASCADE,
    hospital_name VARCHAR(160) NOT NULL,
    region VARCHAR(80) NOT NULL,
    address VARCHAR(300) NOT NULL,
    phone VARCHAR(30),
    homepage_url VARCHAR(500),
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_expert_workplaces_expert_current ON expert_workplaces (expert_id, is_current);

CREATE TABLE expert_topics (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE expert_topic_maps (
    expert_id VARCHAR(36) NOT NULL REFERENCES experts (id) ON DELETE CASCADE,
    topic_id VARCHAR(36) NOT NULL REFERENCES expert_topics (id) ON DELETE CASCADE,
    self_selected BOOLEAN NOT NULL DEFAULT TRUE,
    activity_score INTEGER NOT NULL DEFAULT 0,
    answer_count INTEGER NOT NULL DEFAULT 0,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (expert_id, topic_id)
);

CREATE TABLE expert_questions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users (id) ON DELETE SET NULL,
    author_nickname VARCHAR(40) NOT NULL,
    title VARCHAR(160) NOT NULL,
    content VARCHAR(3000) NOT NULL,
    skin_type VARCHAR(40),
    ingredient_id VARCHAR(64) REFERENCES ingredients (id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_expert_questions_status CHECK (status IN ('OPEN', 'ANSWERED', 'CLOSED'))
);
CREATE INDEX idx_expert_questions_created ON expert_questions (created_at DESC);

CREATE TABLE expert_answers (
    id VARCHAR(36) PRIMARY KEY,
    expert_id VARCHAR(36) NOT NULL REFERENCES experts (id) ON DELETE CASCADE,
    question_id VARCHAR(36) NOT NULL REFERENCES expert_questions (id) ON DELETE CASCADE,
    content VARCHAR(4000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    helpful_count INTEGER NOT NULL DEFAULT 0,
    save_count INTEGER NOT NULL DEFAULT 0,
    adopted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_expert_answers_status CHECK (status IN ('PUBLISHED', 'HIDDEN')),
    CONSTRAINT chk_expert_answers_counts CHECK (helpful_count >= 0 AND save_count >= 0)
);
CREATE INDEX idx_expert_answers_question ON expert_answers (question_id, created_at);
CREATE INDEX idx_expert_answers_expert ON expert_answers (expert_id, created_at DESC);

CREATE TABLE expert_answer_helpfuls (
    user_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    answer_id VARCHAR(36) NOT NULL REFERENCES expert_answers (id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, answer_id)
);

CREATE TABLE expert_answer_saves (
    user_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    answer_id VARCHAR(36) NOT NULL REFERENCES expert_answers (id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, answer_id)
);

INSERT INTO expert_topics (id, code, name) VALUES
    ('topic-barrier', 'BARRIER', '피부 장벽'),
    ('topic-acne', 'ACNE', '트러블·여드름'),
    ('topic-sensitive', 'SENSITIVE', '민감 피부'),
    ('topic-aging', 'AGING', '탄력·노화'),
    ('topic-ingredient', 'INGREDIENT', '화장품 성분');

INSERT INTO experts (id, slug, real_name, license_number_hash, doctor_verified, doctor_verified_at, specialist_verified, specialty, workplace_verified, workplace_verified_at, bio, status, created_at, updated_at) VALUES
    ('expert-seo', 'seo-yuna', '서유나', 'seed-license-hash-seo-yuna-000000000000000000000000000000000000', TRUE, CURRENT_TIMESTAMP, TRUE, '피부과 전문의', TRUE, CURRENT_TIMESTAMP, '민감 피부와 피부 장벽을 중심으로, 성분표를 일상 언어로 풀어 설명합니다.', 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('expert-kim', 'kim-dohyun', '김도현', 'seed-license-hash-kim-dohyun-0000000000000000000000000000000000', TRUE, CURRENT_TIMESTAMP, TRUE, '피부과 전문의', TRUE, CURRENT_TIMESTAMP, '트러블 피부의 화장품 선택과 생활 속 관리 원칙을 답변합니다.', 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('expert-lee', 'lee-harin', '이하린', 'seed-license-hash-lee-harin-00000000000000000000000000000000000', TRUE, CURRENT_TIMESTAMP, FALSE, NULL, TRUE, CURRENT_TIMESTAMP, '화장품 성분과 피부 반응을 근거 중심으로 차분하게 안내합니다.', 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO expert_workplaces (id, expert_id, hospital_name, region, address, phone, homepage_url, is_current, verified, verified_at) VALUES
    ('work-seo', 'expert-seo', '봄결피부과의원', '서울 강남구', '서울특별시 강남구 테헤란로 00', '02-000-0001', NULL, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('work-kim', 'expert-kim', '온마음피부과의원', '서울 마포구', '서울특별시 마포구 월드컵로 00', '02-000-0002', NULL, TRUE, TRUE, CURRENT_TIMESTAMP),
    ('work-lee', 'expert-lee', '맑은결의원', '경기 성남시', '경기도 성남시 분당구 판교로 00', '031-000-0003', NULL, TRUE, TRUE, CURRENT_TIMESTAMP);

INSERT INTO expert_topic_maps (expert_id, topic_id, self_selected, activity_score, answer_count, helpful_count) VALUES
    ('expert-seo', 'topic-barrier', TRUE, 196, 2, 41),
    ('expert-seo', 'topic-sensitive', TRUE, 176, 2, 34),
    ('expert-kim', 'topic-acne', TRUE, 190, 2, 39),
    ('expert-kim', 'topic-ingredient', TRUE, 122, 1, 26),
    ('expert-lee', 'topic-ingredient', TRUE, 154, 2, 33),
    ('expert-lee', 'topic-aging', TRUE, 98, 1, 20);

INSERT INTO expert_questions (id, author_nickname, title, content, skin_type, ingredient_id, status, created_at, updated_at) VALUES
    ('question-barrier', '꽃잎한장', '세라마이드 크림은 매일 발라도 괜찮을까요?', '볼은 건조하고 이마는 번들거리는 편입니다. 장벽이 약해진 느낌이라 세라마이드 크림을 쓰려는데 매일 사용해도 되는지 궁금해요.', '복합성', 'ceramide-np', 'ANSWERED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('question-niacin', '분홍구름', '나이아신아마이드와 비타민C를 같이 써도 되나요?', '아침 루틴에서 두 성분을 함께 쓰고 싶습니다. 자극을 줄이는 순서가 있을까요?', '민감성', 'niacinamide', 'ANSWERED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('question-acne', '초록찻잔', '트러블이 올라올 때 제품 수를 줄이는 게 좋나요?', '갑자기 좁쌀이 늘었습니다. 토너, 세럼, 크림을 모두 바르는 것보다 루틴을 단순하게 해야 할까요?', '지성', NULL, 'ANSWERED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('question-panthenol', '고요한밤', '판테놀 제품을 고를 때 함량이 가장 중요한가요?', '판테놀 함량이 높은 제품과 성분 구성이 단순한 제품 중 무엇을 먼저 봐야 하는지 알고 싶어요.', '건성', 'panthenol', 'OPEN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO expert_answers (id, expert_id, question_id, content, helpful_count, save_count, adopted, created_at, updated_at) VALUES
    ('answer-barrier-seo', 'expert-seo', 'question-barrier', '세라마이드는 피부 장벽을 이루는 지질 성분 중 하나라서 보통 매일 사용할 수 있습니다. 다만 복합성 피부라면 건조한 부위에는 충분히, 유분이 많은 부위에는 얇게 바르며 1~2주 반응을 살펴보세요. 따가움이나 붉어짐이 지속되면 제품 사용을 멈추고 진료를 권합니다.', 28, 15, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('answer-niacin-lee', 'expert-lee', 'question-niacin', '두 성분은 함께 사용할 수 있지만 민감성 피부라면 같은 날 한꺼번에 시작하지 않는 편이 안전합니다. 한 제품씩 낮은 빈도로 도입하고, 아침에는 자외선 차단제를 충분히 사용하세요. 화끈거림이나 홍조가 생기면 번갈아 사용하는 방법을 고려할 수 있습니다.', 24, 12, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('answer-acne-kim', 'expert-kim', 'question-acne', '갑작스러운 트러블 시기에는 새로 추가한 제품을 중단하고 세안제·보습제·자외선 차단제처럼 꼭 필요한 단계만 남겨 원인을 좁히는 것이 도움이 됩니다. 통증이 있거나 빠르게 번지는 염증성 병변은 화장품만으로 해결하려 하지 말고 피부과 진료를 받아보세요.', 31, 19, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
