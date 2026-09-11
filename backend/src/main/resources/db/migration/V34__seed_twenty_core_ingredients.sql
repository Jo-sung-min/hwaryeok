-- Promote twenty widely searched ingredients whose standard names were confirmed in the
-- synchronized MFDS restriction dataset.  Restriction rows remain administrator-reviewed:
-- this migration only creates the public, editorial ingredient dictionary entries.
INSERT INTO ingredients (
    id, name, english_name, role, description, status, caution,
    evidence_level, featured, display_order
) VALUES
    (
        'retinol', '레티놀', 'Retinol', '탄력 · 피부결',
        '거친 피부결과 잔주름이 덜 도드라져 보이도록 관리하는 데 활용되는 비타민 A 계열 성분이에요.',
        'CAUTION',
        '처음에는 낮은 함량을 밤에 주 1~2회부터 사용하고, 건조함이나 따가움이 생기면 횟수를 줄이세요. 낮에는 자외선 차단제를 함께 사용하세요.',
        'A', TRUE, 12
    ),
    (
        'salicylic-acid', '살리실릭애씨드', 'Salicylic Acid', '각질 · 모공',
        '유분과 친한 BHA 계열 성분으로 묵은 각질과 모공 주변의 피지를 부드럽게 정돈하는 데 사용돼요.',
        'CAUTION',
        '건조함이나 따가움이 생길 수 있어 낮은 빈도부터 시작하세요. 같은 날 여러 각질 케어 성분을 겹쳐 쓰지 않고 낮에는 자외선 차단제를 사용하세요.',
        'A', TRUE, 13
    ),
    (
        'glycolic-acid', '글라이콜릭애씨드', 'Glycolic Acid', '각질 · 피부결',
        'AHA 계열 성분으로 피부 표면의 묵은 각질을 정돈해 매끄러운 결과 맑아 보이는 인상을 관리해요.',
        'CAUTION',
        '처음에는 낮은 농도와 빈도로 시작하고 붉어짐이나 따가움이 지속되면 사용을 쉬세요. 다른 강한 각질 케어와의 동시 사용은 피하고 낮에는 자외선 차단제를 사용하세요.',
        'A', TRUE, 14
    ),
    (
        'lactic-acid', '락틱애씨드', 'Lactic Acid', '각질 · 보습',
        '수분을 끌어당기는 성질을 함께 가진 AHA 계열 성분으로 거친 표면 각질과 건조한 피부결을 정돈해요.',
        'CAUTION',
        '각질 케어가 처음이거나 민감한 날에는 낮은 빈도로 사용하세요. 따가움이 지속되면 중단하고 낮에는 자외선 차단제를 사용하세요.',
        'A', TRUE, 15
    ),
    (
        'gluconolactone', '글루코노락톤', 'Gluconolactone', '각질 · 보습',
        'PHA 계열 성분으로 피부 표면을 비교적 부드럽게 정돈하면서 수분을 유지하는 데 도움을 줘요.',
        'GOOD',
        '순한 편으로 알려져 있어도 각질 케어 성분이에요. 민감한 날에는 사용 간격을 두고 다른 필링 성분과 한꺼번에 겹치지 마세요.',
        'B', TRUE, 16
    ),
    (
        'mandelic-acid', '만델릭애씨드', 'Mandelic Acid', '각질 · 피부결',
        '분자 크기가 비교적 큰 AHA 계열 성분으로 피부 표면의 묵은 각질과 울퉁불퉁한 결을 천천히 정돈해요.',
        'CAUTION',
        '낮은 농도와 빈도부터 시작하고 자극이 느껴지는 날에는 쉬어 주세요. 다른 각질 케어 성분과 겹쳐 쓰지 않고 낮에는 자외선 차단제를 사용하세요.',
        'B', TRUE, 17
    ),
    (
        'azelaic-acid', '아젤라익애씨드', 'Azelaic Acid', '피부 톤 · 피부결 관리',
        '다이카복실릭애씨드 계열 성분으로 고르지 않은 피부 톤과 붉고 거친 인상을 함께 관리하는 제품에 사용돼요.',
        'GOOD',
        '처음 사용할 때 따가움이나 건조함이 느껴질 수 있어 소량과 낮은 빈도부터 시작하세요. 피부가 불편하면 사용을 쉬고 제품 표시사항을 확인하세요.',
        'A', TRUE, 18
    ),
    (
        'tranexamic-acid', '트라넥사믹애씨드', 'Tranexamic Acid', '피부 톤 · 흔적 케어',
        '칙칙함과 국소적인 색소 흔적이 덜 도드라져 보이도록 피부 톤을 균일하게 관리하는 제품에 사용돼요.',
        'GOOD',
        '민감한 피부는 작은 부위에서 먼저 사용해보세요. 피부 톤 관리는 꾸준한 자외선 차단과 함께해야 해요.',
        'B', TRUE, 19
    ),
    (
        'alpha-arbutin', '알파-알부틴', 'Alpha-Arbutin', '피부 톤 · 잡티 흔적',
        '칙칙함과 잡티 흔적이 덜 도드라져 보이도록 맑고 균일한 피부 톤을 관리하는 데 쓰이는 성분이에요.',
        'GOOD',
        '처음에는 작은 부위에서 피부 반응을 확인하고, 피부 톤 케어 중에는 낮에 자외선 차단제를 함께 사용하세요.',
        'B', TRUE, 20
    ),
    (
        'ethyl-ascorbic-acid', '3-O-에틸아스코빅애씨드', '3-O-Ethyl Ascorbic Acid', '피부 톤 · 항산화',
        '비타민 C를 화장품에 안정적으로 담기 위해 만든 유도체로 칙칙함과 외부 환경으로 인한 피부 스트레스를 관리해요.',
        'GOOD',
        '피부 상태에 따라 따끔함을 느낄 수 있어 처음에는 소량부터 사용하세요. 제품의 색이나 냄새가 크게 변했다면 보관 상태와 사용기한을 확인하세요.',
        'B', TRUE, 21
    ),
    (
        'ascorbyl-glucoside', '아스코빌글루코사이드', 'Ascorbyl Glucoside', '피부 톤 · 항산화',
        '비타민 C에 포도당을 결합한 수용성 유도체로 피부가 맑아 보이도록 돕고 산화 스트레스 관리를 보조해요.',
        'GOOD',
        '예민한 피부는 작은 부위에서 먼저 확인하고 자극적인 각질 케어와 한꺼번에 시작하지 마세요. 낮에는 자외선 차단제를 함께 사용하세요.',
        'B', TRUE, 22
    ),
    (
        'bisabolol', '비사보롤', 'Bisabolol', '진정 · 붉은기',
        '식물에서 발견되거나 합성될 수 있는 피부 컨디셔닝 성분으로 외부 자극을 받은 피부가 편안하게 느껴지도록 돕는 제품에 사용돼요.',
        'GOOD', NULL,
        'B', TRUE, 23
    ),
    (
        'allantoin', '알란토인', 'Allantoin', '진정 · 피부 보호',
        '거칠고 불편한 피부를 부드럽게 정돈하고 편안한 상태를 유지하도록 돕는 피부 보호 성분이에요.',
        'GOOD', NULL,
        'B', TRUE, 24
    ),
    (
        'caffeine', '카페인', 'Caffeine', '피부 컨디셔닝 · 항산화',
        '항산화 특성을 가진 성분으로 눈가나 얼굴의 일시적인 붓기 인상이 덜 도드라져 보이도록 관리하는 제품에 사용돼요.',
        'GOOD',
        '눈가 제품은 눈 안에 들어가지 않도록 제품의 사용 부위와 방법을 지켜 주세요. 민감하면 작은 부위에서 먼저 확인하세요.',
        'C', TRUE, 25
    ),
    (
        'ferulic-acid', '페룰릭애씨드', 'Ferulic Acid', '항산화 · 제형 안정 보조',
        '식물에서 유래할 수 있는 항산화 성분으로 외부 환경에 노출된 피부를 관리하고 비타민 성분이 든 제형의 조합에 활용돼요.',
        'GOOD',
        '함께 배합된 성분과 농도에 따라 따끔함이 느껴질 수 있어 민감한 피부는 작은 부위에서 먼저 확인하세요. 항산화 성분은 자외선 차단제를 대신하지 않아요.',
        'B', TRUE, 26
    ),
    (
        'tocopherol', '토코페롤', 'Tocopherol', '항산화 · 보습',
        '비타민 E로 알려진 지용성 항산화 성분으로 피부의 유분막을 보완하고 외부 환경으로 인한 건조함을 관리해요.',
        'GOOD',
        '오일감이 많은 제형은 지성 피부에서 무겁게 느껴질 수 있으니 제형과 사용량을 함께 살펴보세요.',
        'B', TRUE, 27
    ),
    (
        'urea', '우레아', 'Urea', '보습 · 각질 유연',
        '피부의 천연보습인자에도 포함되는 성분으로 수분을 붙잡고 거칠게 들뜬 각질을 부드럽게 만드는 데 도움을 줘요.',
        'GOOD',
        '함량이 높을수록 각질을 부드럽게 하는 작용과 따가움이 커질 수 있어요. 손상되거나 매우 예민한 부위는 낮은 함량부터 확인하세요.',
        'A', TRUE, 28
    ),
    (
        'zinc-pca', '징크피씨에이', 'Zinc PCA', '유분 균형 · 피부 컨디셔닝',
        '아연과 PCA를 결합한 성분으로 번들거림과 수분 균형을 함께 고려하는 제품에 사용돼요.',
        'GOOD', NULL,
        'B', TRUE, 29
    ),
    (
        'titanium-dioxide', '티타늄디옥사이드', 'Titanium Dioxide', '무기 자외선 차단',
        '자외선을 막는 데 사용되는 무기 자외선 차단 성분이자 제품의 색과 불투명도를 조절하는 안료예요.',
        'GOOD',
        '자외선 차단 효과는 이 성분의 존재만으로 정해지지 않아요. 완제품의 자외선 차단 지수와 사용량, 덧바르는 방법을 확인하고 분말이나 분사형 제품은 흡입 주의사항을 따르세요.',
        'A', TRUE, 30
    ),
    (
        'zinc-oxide', '징크옥사이드', 'Zinc Oxide', '무기 자외선 차단',
        '넓은 범위의 자외선을 막는 데 사용되는 무기 자외선 차단 성분으로 민감 피부용 선케어에도 자주 쓰여요.',
        'GOOD',
        '자외선 차단 효과는 완제품 시험과 충분한 사용량을 기준으로 확인해야 해요. 분말이나 분사형 제품은 제품의 흡입 주의사항을 따르세요.',
        'A', TRUE, 31
    )
ON CONFLICT DO NOTHING;

INSERT INTO ingredient_tags (ingredient_id, tag) VALUES
    ('retinol', '탄력'), ('retinol', '피부결'), ('retinol', '주의'),
    ('salicylic-acid', '각질'), ('salicylic-acid', '모공'), ('salicylic-acid', '유분균형'), ('salicylic-acid', '주의'),
    ('glycolic-acid', '각질'), ('glycolic-acid', '피부결'), ('glycolic-acid', '피부톤'), ('glycolic-acid', '주의'),
    ('lactic-acid', '각질'), ('lactic-acid', '보습'), ('lactic-acid', '피부결'), ('lactic-acid', '주의'),
    ('gluconolactone', '각질'), ('gluconolactone', '보습'), ('gluconolactone', '민감'),
    ('mandelic-acid', '각질'), ('mandelic-acid', '피부결'), ('mandelic-acid', '주의'),
    ('azelaic-acid', '피부톤'), ('azelaic-acid', '붉은기'), ('azelaic-acid', '유분균형'),
    ('tranexamic-acid', '피부톤'), ('tranexamic-acid', '잡티'),
    ('alpha-arbutin', '피부톤'), ('alpha-arbutin', '잡티'),
    ('ethyl-ascorbic-acid', '피부톤'), ('ethyl-ascorbic-acid', '항산화'),
    ('ascorbyl-glucoside', '피부톤'), ('ascorbyl-glucoside', '항산화'),
    ('bisabolol', '진정'), ('bisabolol', '붉은기'), ('bisabolol', '민감'),
    ('allantoin', '진정'), ('allantoin', '장벽'), ('allantoin', '보습'),
    ('caffeine', '붓기'), ('caffeine', '항산화'),
    ('ferulic-acid', '항산화'), ('ferulic-acid', '피부톤'),
    ('tocopherol', '항산화'), ('tocopherol', '보습'), ('tocopherol', '장벽'),
    ('urea', '보습'), ('urea', '각질'), ('urea', '장벽'),
    ('zinc-pca', '유분균형'), ('zinc-pca', '모공'), ('zinc-pca', '보습'),
    ('titanium-dioxide', '자외선차단'), ('titanium-dioxide', '무기자차'),
    ('zinc-oxide', '자외선차단'), ('zinc-oxide', '무기자차'), ('zinc-oxide', '민감')
ON CONFLICT DO NOTHING;

INSERT INTO ingredient_skin_type_features (ingredient_id, skin_type, feature) VALUES
    ('retinol', '지성', '번들거림과 함께 거친 피부결이 신경 쓰일 때 가벼운 제형과 낮은 빈도부터 살펴보세요.'),
    ('retinol', '민감', '건조함과 붉어짐이 생기기 쉬워 낮은 함량을 천천히 적응하는 방식이 좋아요.'),
    ('salicylic-acid', '지성', '모공 주변 피지와 묵은 각질을 함께 정돈하는 제품에서 확인하기 좋아요.'),
    ('salicylic-acid', '건성', '건조함이 더 느껴질 수 있어 좁은 부위와 낮은 빈도로 사용하고 보습을 충분히 더하세요.'),
    ('glycolic-acid', '복합성', '거칠고 칙칙해 보이는 부위를 중심으로 사용 빈도를 조절해보세요.'),
    ('glycolic-acid', '민감', '자극을 느끼기 쉬워 낮은 농도와 짧은 사용 시간부터 확인하는 편이 좋아요.'),
    ('lactic-acid', '건성', '표면 각질을 정돈하면서 촉촉한 사용감을 원하는 경우 살펴볼 수 있어요.'),
    ('lactic-acid', '민감', '민감 피부에서도 따가움이나 붉어짐이 생길 수 있어 낮은 빈도부터 피부 반응을 확인하세요.'),
    ('gluconolactone', '민감', '강한 필링이 부담스러울 때 비교적 부드러운 표면 각질 케어로 살펴볼 수 있어요.'),
    ('gluconolactone', '건성', '각질과 수분 관리를 한 번에 원하는 경우 보습 제형에서 확인해보세요.'),
    ('mandelic-acid', '지성', '번들거림과 울퉁불퉁한 결을 천천히 정돈하고 싶을 때 살펴볼 수 있어요.'),
    ('mandelic-acid', '민감', '분자 크기가 비교적 크더라도 자극이 없다는 뜻은 아니므로 낮은 빈도부터 피부 반응을 확인하세요.'),
    ('azelaic-acid', '지성', '유분과 붉은 흔적, 고르지 않은 결을 함께 관리하고 싶을 때 살펴보세요.'),
    ('azelaic-acid', '민감', '초기 따가움이 느껴질 수 있어 보습제와 함께 소량부터 적응하는 편이 좋아요.'),
    ('tranexamic-acid', '복합성', '부위별로 남은 칙칙한 흔적을 무겁지 않은 제형으로 관리하기 좋아요.'),
    ('tranexamic-acid', '민감', '단순한 배합과 보습 성분이 함께 든 제형부터 작은 부위에서 먼저 확인하세요.'),
    ('alpha-arbutin', '건성', '보습 성분이 함께 든 제품을 고르면 피부 톤과 건조함을 같이 관리하기 좋아요.'),
    ('alpha-arbutin', '민감', '낮은 함량과 단순한 배합의 제품부터 피부 반응을 확인해보세요.'),
    ('ethyl-ascorbic-acid', '복합성', '유분 부담이 적은 제형으로 칙칙한 인상과 항산화 관리를 시작하기 좋아요.'),
    ('ethyl-ascorbic-acid', '민감', '따끔함을 느낄 수 있어 다른 활성 성분과 동시에 새로 시작하지 않는 편이 좋아요.'),
    ('ascorbyl-glucoside', '건성', '수분 제형에 담긴 제품으로 칙칙함과 건조한 인상을 함께 관리해보세요.'),
    ('ascorbyl-glucoside', '민감', '비타민 C 유도체도 피부에 따라 자극적일 수 있어 작은 부위에서 먼저 확인하세요.'),
    ('bisabolol', '민감', '외부 자극으로 붉고 불편한 날 편안한 진정 제형에서 확인하기 좋아요.'),
    ('bisabolol', '건성', '건조함과 함께 느껴지는 불편함을 보습 성분과 함께 관리하기 좋아요.'),
    ('allantoin', '민감', '피부가 쉽게 불편해질 때 단순한 진정·보호 제형에서 살펴볼 수 있어요.'),
    ('allantoin', '건성', '거칠고 들뜬 피부를 부드럽게 정돈하는 보습 제품에서 확인해보세요.'),
    ('caffeine', '복합성', '무거운 유분감 없이 일시적인 붓기 인상을 관리하고 싶을 때 살펴볼 수 있어요.'),
    ('caffeine', '민감', '눈가처럼 얇은 부위는 향료가 적고 사용 부위가 명확한 전용 제품을 고르세요.'),
    ('ferulic-acid', '건성', '보습 성분과 함께 담긴 항산화 제품으로 건조하고 칙칙한 인상을 관리해보세요.'),
    ('ferulic-acid', '민감', '비타민 C 등 다른 활성 성분과 함께 든 경우가 많아 전체 배합을 확인하세요.'),
    ('tocopherol', '건성', '유분막과 보습이 부족한 피부에 촉촉하고 편안한 사용감을 더하기 좋아요.'),
    ('tocopherol', '지성', '오일 함량이 높은 제형은 무겁게 느껴질 수 있어 가벼운 제형을 선택하세요.'),
    ('urea', '건성', '수분을 붙잡고 거칠게 들뜬 각질을 부드럽게 관리하는 데 잘 맞아요.'),
    ('urea', '민감', '피부가 갈라졌거나 자극받은 날에는 따가울 수 있어 낮은 함량부터 확인하세요.'),
    ('zinc-pca', '지성', '과한 번들거림을 줄이면서 수분 균형을 잃지 않는 제형에서 확인하기 좋아요.'),
    ('zinc-pca', '수부지', '유분은 많고 속은 당길 때 가벼운 수분 제품의 균형 성분으로 살펴보세요.'),
    ('titanium-dioxide', '민감', '무기 자외선 차단 제품을 살펴보되 필터 종류뿐 아니라 완제품 전체 배합과 사용감을 함께 비교하세요.'),
    ('titanium-dioxide', '건성', '백탁과 뻑뻑함이 느껴질 수 있어 보습감 있는 완제품 제형을 함께 살펴보세요.'),
    ('zinc-oxide', '민감', '민감 피부용 제품에서 자주 보이지만 필터 종류뿐 아니라 완제품 전체 배합과 사용감을 함께 비교하세요.'),
    ('zinc-oxide', '지성', '제형에 따라 보송하게 느껴질 수 있으므로 들뜸 없이 발리는지 확인해보세요.')
ON CONFLICT DO NOTHING;

INSERT INTO ingredient_concern_features (ingredient_id, concern, feature) VALUES
    ('retinol', '탄력', '꾸준히 적응해 사용하면 잔주름과 탄력 저하가 덜 도드라져 보이도록 관리하는 데 도움을 줄 수 있어요.'),
    ('retinol', '피부결', '거칠고 고르지 않아 보이는 피부 표면을 매끄럽게 정돈하는 데 활용돼요.'),
    ('salicylic-acid', '모공', '모공 주변의 피지와 각질을 정돈해 답답하고 도드라져 보이는 인상을 줄이는 데 도움을 줘요.'),
    ('salicylic-acid', '각질', '유분이 많은 부위의 묵은 각질을 부드럽게 제거하는 데 활용돼요.'),
    ('glycolic-acid', '피부결', '피부 표면의 묵은 각질을 정돈해 만졌을 때 매끄러운 결을 만드는 데 도움을 줘요.'),
    ('glycolic-acid', '칙칙함', '각질로 칙칙해 보이는 피부가 한결 맑아 보이도록 관리해요.'),
    ('lactic-acid', '각질', '들뜨고 거친 표면 각질을 정돈해 부드러운 피부결을 만드는 데 도움을 줘요.'),
    ('lactic-acid', '속건조', '수분을 끌어당기는 성질이 있어 각질 케어 후 촉촉함을 보완하는 데 활용돼요.'),
    ('gluconolactone', '각질', '민감하게 느껴지는 피부의 표면 각질을 비교적 부드럽게 정돈해요.'),
    ('gluconolactone', '속건조', '수분을 유지하면서 거친 피부결을 관리하고 싶을 때 살펴볼 수 있어요.'),
    ('mandelic-acid', '각질', '묵은 각질을 천천히 정돈해 부담을 조절하며 사용할 수 있어요.'),
    ('mandelic-acid', '피부결', '울퉁불퉁하고 거친 피부 표면이 매끄러워 보이도록 관리해요.'),
    ('azelaic-acid', '붉은기', '붉고 고르지 않아 보이는 피부 인상을 편안하고 균일하게 관리하는 제품에 사용돼요.'),
    ('azelaic-acid', '트러블 흔적', '트러블 뒤에 남은 고르지 않은 색과 거친 결이 덜 도드라져 보이도록 도와요.'),
    ('tranexamic-acid', '칙칙함', '피부 전체가 고르게 맑아 보이도록 톤을 정돈하는 데 도움을 줄 수 있어요.'),
    ('tranexamic-acid', '잡티 흔적', '부분적으로 남은 색소 흔적이 덜 도드라져 보이도록 꾸준히 관리해요.'),
    ('alpha-arbutin', '칙칙함', '멜라닌으로 칙칙해 보이는 인상을 맑고 균일하게 관리하는 데 활용돼요.'),
    ('alpha-arbutin', '잡티 흔적', '국소적인 색소 흔적이 주변 피부와 자연스럽게 어우러져 보이도록 도와요.'),
    ('ethyl-ascorbic-acid', '칙칙함', '산화 스트레스와 묵은 각질로 칙칙해 보이는 피부의 맑은 인상을 관리해요.'),
    ('ethyl-ascorbic-acid', '탄력', '항산화 관리를 통해 탄력이 떨어져 보이는 피부를 건강한 인상으로 가꾸는 데 활용돼요.'),
    ('ascorbyl-glucoside', '칙칙함', '비타민 C 유도체로 피부가 맑고 균일해 보이도록 관리하는 데 도움을 줘요.'),
    ('ascorbyl-glucoside', '외부 자극', '항산화 관리로 외부 환경 때문에 지쳐 보이는 피부 인상을 보호하는 데 활용돼요.'),
    ('bisabolol', '민감', '외부 자극으로 불편하게 느껴지는 피부를 편안하게 진정시키는 데 도움을 줘요.'),
    ('bisabolol', '붉은기', '일시적인 붉은 인상이 덜 도드라져 보이도록 부드럽게 관리해요.'),
    ('allantoin', '민감', '거칠고 불편한 피부가 편안한 상태를 유지하도록 보호하는 데 도움을 줘요.'),
    ('allantoin', '거친 피부결', '들뜬 피부 표면을 부드럽게 정돈해 매끈한 사용감을 더해요.'),
    ('caffeine', '붓기', '눈가와 얼굴의 일시적인 붓기 인상이 덜 도드라져 보이도록 관리하는 데 활용돼요.'),
    ('caffeine', '칙칙한 인상', '항산화 특성으로 피곤하고 칙칙해 보이는 피부 인상을 보완하는 제품에 사용돼요.'),
    ('ferulic-acid', '외부 자극', '항산화 관리로 햇빛과 건조한 환경에 노출된 피부 컨디션을 돌보는 데 활용돼요.'),
    ('ferulic-acid', '칙칙함', '비타민 성분과 함께 맑고 생기 있어 보이는 피부 톤을 관리하는 데 활용돼요.'),
    ('tocopherol', '속건조', '지질 친화적인 보습막을 보완해 수분이 날아가는 것을 줄이는 데 도움을 줘요.'),
    ('tocopherol', '외부 자극', '비타민 E의 항산화 특성으로 외부 환경에 노출된 피부를 보호하는 관리에 활용돼요.'),
    ('urea', '속건조', '피부에 수분을 붙잡아 당기고 메마른 느낌을 줄이는 데 도움을 줘요.'),
    ('urea', '각질', '두껍고 거칠게 들뜬 각질을 부드럽게 만들어 매끄럽게 정돈해요.'),
    ('zinc-pca', '유분', '번들거림과 수분 균형을 함께 고려한 산뜻한 제형에서 확인할 수 있어요.'),
    ('zinc-pca', '모공', '피지로 모공이 더 도드라져 보이는 인상을 줄이는 관리에 활용돼요.'),
    ('titanium-dioxide', '자외선', '완제품에서 자외선 차단 기능을 구성해 일상적인 햇빛 노출을 관리하는 역할을 해요.'),
    ('titanium-dioxide', '민감', '무기 자외선 차단 제품을 찾는 민감 피부가 비교해볼 핵심 필터 중 하나예요.'),
    ('zinc-oxide', '자외선', '완제품에서 넓은 범위의 자외선 차단 기능을 구성해 일상적인 햇빛 노출을 관리해요.'),
    ('zinc-oxide', '민감', '민감 피부용 선케어의 무기 필터 구성을 확인할 때 살펴볼 수 있어요.')
ON CONFLICT DO NOTHING;

-- Keep the curated rows available to the official full-ingredient matching pipeline.
INSERT INTO cosmetic_ingredient_references (
    source_id, source_ingredient_id, standard_name, normalized_name, english_name,
    collected_at, raw_source_row
)
SELECT
    'LEGACY_CURATED', ingredient.id, ingredient.name,
    LOWER(REPLACE(REPLACE(REPLACE(REPLACE(ingredient.name, ' ', ''), '-', ''), '·', ''), '/', '')),
    NULLIF(ingredient.english_name, ''), CURRENT_TIMESTAMP,
    '식약처 사용제한 원료 API 표준명 대조 후 화력 핵심 성분 편집 검수'
FROM ingredients ingredient
WHERE ingredient.id IN (
    'retinol', 'salicylic-acid', 'glycolic-acid', 'lactic-acid', 'gluconolactone',
    'mandelic-acid', 'azelaic-acid', 'tranexamic-acid', 'alpha-arbutin',
    'ethyl-ascorbic-acid', 'ascorbyl-glucoside', 'bisabolol', 'allantoin', 'caffeine',
    'ferulic-acid', 'tocopherol', 'urea', 'zinc-pca', 'titanium-dioxide', 'zinc-oxide'
)
ON CONFLICT DO NOTHING;

INSERT INTO cosmetic_ingredient_aliases (
    source_id, source_ingredient_id, alias, normalized_alias, alias_type
)
SELECT
    'LEGACY_CURATED', ingredient.id, ingredient.name,
    LOWER(REPLACE(REPLACE(REPLACE(REPLACE(ingredient.name, ' ', ''), '-', ''), '·', ''), '/', '')),
    'STANDARD'
FROM ingredients ingredient
WHERE ingredient.id IN (
    'retinol', 'salicylic-acid', 'glycolic-acid', 'lactic-acid', 'gluconolactone',
    'mandelic-acid', 'azelaic-acid', 'tranexamic-acid', 'alpha-arbutin',
    'ethyl-ascorbic-acid', 'ascorbyl-glucoside', 'bisabolol', 'allantoin', 'caffeine',
    'ferulic-acid', 'tocopherol', 'urea', 'zinc-pca', 'titanium-dioxide', 'zinc-oxide'
)
ON CONFLICT DO NOTHING;

INSERT INTO cosmetic_ingredient_aliases (
    source_id, source_ingredient_id, alias, normalized_alias, alias_type
)
SELECT
    'LEGACY_CURATED', ingredient.id, ingredient.english_name,
    LOWER(REPLACE(REPLACE(REPLACE(REPLACE(ingredient.english_name, ' ', ''), '-', ''), '·', ''), '/', '')),
    'ENGLISH'
FROM ingredients ingredient
WHERE ingredient.id IN (
    'retinol', 'salicylic-acid', 'glycolic-acid', 'lactic-acid', 'gluconolactone',
    'mandelic-acid', 'azelaic-acid', 'tranexamic-acid', 'alpha-arbutin',
    'ethyl-ascorbic-acid', 'ascorbyl-glucoside', 'bisabolol', 'allantoin', 'caffeine',
    'ferulic-acid', 'tocopherol', 'urea', 'zinc-pca', 'titanium-dioxide', 'zinc-oxide'
)
  AND ingredient.english_name <> ''
ON CONFLICT DO NOTHING;
