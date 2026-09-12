# 화력 API

Spring Boot 4.1, Java 21, PostgreSQL 기반 REST API입니다.

## 실행

PostgreSQL 없이 개발 서버를 빠르게 확인하려면 바로 실행합니다. `bootRun`에만 개발 전용 `local` 프로필과 H2가 자동 적용됩니다.

```bash
./gradlew bootRun
```

PostgreSQL 연동을 확인하려면 프로젝트 루트에서 PostgreSQL을 시작합니다.

```bash
docker compose up -d postgres
```

백엔드를 실행합니다.

```bash
cd backend
./gradlew bootRun --args="--spring.profiles.active=postgres"
```

Windows에서는 `gradlew.bat bootRun` 또는 PostgreSQL용 `gradlew.bat bootRun --args="--spring.profiles.active=postgres"`를 사용합니다. 로컬 기본 주소는 `http://localhost:8081`입니다.

백엔드는 실행 위치에 따라 `backend/.env` 또는 저장소 루트의 `.env`를 자동으로 읽습니다. PostgreSQL을 사용할 때는 `backend/.env.example`을 복사하고 접속 정보와 임의의 `JWT_SECRET`, `LICENSE_HASH_SECRET`을 입력합니다.

```text
DB_URL=jdbc:postgresql://호스트:5432/데이터베이스명
DB_USER=데이터베이스사용자
DB_PASSWORD=데이터베이스비밀번호
DB_SCHEMA=hwaryeok
```

시작할 때 Flyway가 `DB_SCHEMA`를 생성하고 마이그레이션을 적용하며, Hibernate는 같은 스키마를 검증해 사용합니다.
Spring Boot 4의 Flyway 자동 구성은 `spring-boot-starter-flyway`로 활성화되어 Hibernate보다 먼저 실행됩니다.

### 데이터베이스 커넥션 풀

애플리케이션은 Spring이 생성하는 전역 HikariCP `DataSource` 하나를 재사용합니다. JPA와 `JdbcTemplate`은 이 풀에서 연결을 빌리고 작업이 끝나면 자동으로 반환하므로, 서비스 코드에서 `Connection`을 직접 생성하거나 `close()`하지 않습니다.

기본값은 최대 5개·최소 유휴 1개이며, 5분 동안 사용하지 않은 연결은 정리하고 연결 수명은 25분으로 제한합니다. 60초 이상 반환되지 않은 연결은 누수 의심 로그를 남깁니다. Supabase 플랜의 연결 제한이나 배포 인스턴스 수에 따라 아래 `DB_POOL_*` 값을 조정할 수 있습니다.

```text
DB_POOL_NAME=HwaryeokPool
DB_POOL_MAX_SIZE=5
DB_POOL_MIN_IDLE=1
DB_CONNECTION_TIMEOUT_MS=30000
DB_POOL_VALIDATION_TIMEOUT_MS=5000
DB_POOL_IDLE_TIMEOUT_MS=300000
DB_POOL_MAX_LIFETIME_MS=1500000
DB_POOL_KEEPALIVE_MS=120000
DB_POOL_LEAK_DETECTION_MS=60000
```

이미 적용된 `V1__create_products.sql`은 체크섬이 바뀌지 않도록 수정하지 않습니다. 이후 DB 구조 변경은 `V2__...sql`처럼 새 버전 마이그레이션으로 추가합니다.

## 공식 화장품 데이터 파이프라인

관리자 화면의 `/admin/data-sources`에서 다음 순서로 관리합니다.

1. 공공데이터포털에서 식약처 **기능성화장품 보고품목정보**와 **화장품 사용제한 원료정보** 활용을 신청합니다.
2. 발급받은 일반 인증키와 각 API의 요청주소를 환경 변수에 등록한 뒤 `식약처 데이터 동기화`를 실행합니다.
3. 대한화장품협회의 이용조건과 별도 사용권을 확인한 공식 CSV/XLSX 성분 목록을 `협회 성분사전 적재`에서 업로드합니다.
4. `/admin/products`에서 제품별 브랜드 공식 HTTPS 주소, 확인일, 전성분 원문을 등록합니다. 모든 성분이 표준사전에 연결된 경우에만 공개 제품 성분표를 교체합니다.

```text
MFDS_API_SERVICE_KEY=공공데이터포털_일반_인증키
MFDS_FUNCTIONAL_COSMETICS_API_URL=활용신청한_기능성화장품_API_요청주소
MFDS_RESTRICTED_INGREDIENTS_API_URL=활용신청한_사용제한원료_API_요청주소
```

`V24__create_cosmetic_data_pipeline.sql`은 원천 메타데이터, 수집 이력, 표준 성분·별칭, 식약처 제품·제한 원료, 제품 매칭, 브랜드 공식 전성분 출처를 PostgreSQL에 생성합니다. 대한화장품협회 성분사전은 상업적 사용권을 확인하지 않은 자동 수집을 하지 않으며, 관리자가 권한을 확인한 원본 파일만 적재합니다. 브랜드 페이지도 임의 크롤링하지 않고 관리자가 공식 페이지와 전성분 원문을 함께 검수해 등록합니다.

## 화해 공개 랭킹 샘플 데이터

`V7__seed_hwahae_ranking_samples.sql`은 2026-08-13 화해 공개 급상승 랭킹에서 확인한 기초 화장품 16종을 추가합니다. 공개 랭킹의 제품 ID·브랜드·제품명·정가·용량·평점·리뷰 수만 사용하며, 리뷰 본문이나 회원 정보는 수집하지 않습니다. 베이비·두피·핸드 제품과 중복 제품명은 화력 서비스 범위에서 제외했습니다.

- 원본 스냅샷: `src/main/resources/seed/hwahae-ranking-2026-08-13.json`
- 재수집 도구: `scripts/crawl-hwahae-ranking.mjs`
- 출처 기록: `product_source_snapshots`
- 화력 초기 점수: `round(화해 공개 평점 × 20)`
- 카테고리·효능: 제품명에 명시된 키워드만 규칙 기반으로 변환

현재 공개 데이터를 화면에 출력해 확인하려면 백엔드 폴더에서 다음 명령을 실행합니다.

```bash
node scripts/crawl-hwahae-ranking.mjs
```

스냅샷 파일을 갱신하려면 아래처럼 출력 경로를 지정합니다. 랭킹과 리뷰 수는 바뀔 수 있으므로 갱신 결과를 검토한 뒤 기존에 적용된 마이그레이션을 수정하지 말고 새 마이그레이션으로 반영합니다.

```bash
node scripts/crawl-hwahae-ranking.mjs --output=src/main/resources/seed/hwahae-ranking-YYYY-MM-DD.json
```

수집기는 먼저 `robots.txt`를 확인하고 허용된 공개 `/rankings` 페이지만 한 번 요청합니다. 제품 상세처럼 제한되거나 자동화 차단이 걸린 경로는 우회하지 않습니다. 전성분은 이번 공개 랭킹 데이터에 없으므로 임의로 연결하지 않았습니다.

Docker 없이 화면 연동을 빠르게 확인할 때만 개발용 H2 프로필을 사용할 수 있습니다.

```bash
gradlew.bat bootRun --args="--spring.profiles.active=local"
```

`local` 프로필의 데이터는 서버를 종료하면 사라지며, 실제 개발·운영 데이터베이스는 PostgreSQL을 사용합니다.

## 핵심 API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/actuator/health` | 서버 상태 확인 |
| POST | `/api/v1/auth/signup` | 회원가입 |
| POST | `/api/v1/auth/login` | 이메일·비밀번호 로그인 |
| POST | `/api/v1/auth/refresh` | Access/Refresh Token 갱신 |
| POST | `/api/v1/auth/logout` | 로그인 세션 폐기 |
| POST | `/api/v1/auth/oauth/exchange` | OAuth 일회용 코드 교환 |
| GET | `/api/v1/auth/oauth/providers` | OAuth 공급자 설정 상태 |
| GET | `/api/v1/users/me/skin-profile` | 내 피부 프로필 조회 |
| PUT | `/api/v1/users/me/skin-profile` | 내 피부 프로필 생성·수정 |
| GET | `/api/v1/users/me/favorites` | 내 찜 제품 최신순 목록 |
| PUT | `/api/v1/users/me/favorites/{productId}` | 제품 찜 추가 |
| DELETE | `/api/v1/users/me/favorites/{productId}` | 제품 찜 취소 |
| GET | `/api/v1/users/me/recent-products` | 내 최근 본 제품 최신순 목록 |
| PUT | `/api/v1/users/me/recent-products/{productId}` | 제품 상세 확인 기록·최근 시각 갱신 |
| GET | `/api/v1/users/me/comparison-products` | 저장한 비교 제품 2~3개 조회 |
| PUT | `/api/v1/users/me/comparison-products` | 비교 제품 2~3개 순서대로 저장·교체 |
| DELETE | `/api/v1/users/me/comparison-products` | 저장한 비교 제품 모두 해제 |
| GET | `/api/v1/users/me/preferred-ingredients` | 내 관심 성분 우선순위 조회 |
| PUT | `/api/v1/users/me/preferred-ingredients` | 내 관심 성분 0~10개 저장 |
| GET | `/oauth2/authorization/kakao` | 카카오 로그인 시작 |
| GET | `/login/oauth2/code/kakao` | 카카오 OAuth 콜백 |
| GET | `/api/v1/auth/me` | Bearer Token 현재 사용자 확인 |
| GET | `/api/v1/products` | 제품 검색·필터·페이지네이션·정렬 |
| GET | `/api/v1/products/{id}` | 제품 상세 |
| GET | `/api/v1/products/{id}/ingredients` | 제품별 성분 요약·필터 |
| GET | `/api/v1/products/ranking` | 피부 타입별 랭킹 |
| GET | `/api/v1/ingredients` | 성분 검색·필터·페이지네이션·정렬 |
| GET | `/api/v1/ingredients/{id}` | 성분 상세와 포함 제품 |
| GET | `/api/v1/ingredients/featured` | 대표 관심 성분 목록 |
| GET | `/api/v1/ingredients/{id}/firepower` | 성분 기준 제품 화력 순위와 세부 점수 |
| POST | `/api/v1/admin/products/{id}/image-upload-url` | 관리자 제품 이미지 Presigned PUT URL 발급 |
| POST | `/api/v1/admin/products/{id}/image-upload-complete` | S3 업로드 검증 후 제품 이미지 확정 |
| PUT | `/api/v1/admin/products/{id}/image` | 기존 multipart 업로드(하위 호환용, deprecated) |
| GET | `/api/v1/admin/data-sources` | 관리자 공식 데이터 원천·적재 상태 조회 |
| POST | `/api/v1/admin/data-sources/mfds/sync` | 식약처 기능성 제품·사용제한 원료 동기화 |
| POST | `/api/v1/admin/data-sources/kcia/import` | 사용권 확인된 협회 성분사전 파일 적재 |
| PUT | `/api/v1/admin/data-sources/products/{id}/official-ingredients` | 브랜드 공식 전성분 검수·등록 |
| GET | `/api/v1/media/products/{id}` | 등록 제품 이미지 조회 |
| POST | `/api/v1/analyses/preview` | 피부 프로필 기반 화력 분석 |
| GET | `/api/v1/experts` | 인증 전문가 목록과 활동 통계 |
| GET | `/api/v1/experts/{slug}` | 전문가 상세·근무지·최근 답변 |
| GET | `/api/v1/experts/rankings` | 기간·주제별 플랫폼 기여 활동 랭킹 |
| GET | `/api/v1/questions` | 공개 질문 목록 |
| GET | `/api/v1/questions/{id}` | 질문과 전문가 답변 상세 |
| POST | `/api/v1/users/me/questions` | 로그인 회원 질문 작성 |
| POST | `/api/v1/expert/questions/{id}/answers` | 인증 전문가 답변 작성 |
| GET, POST | `/api/v1/experts/me/application` | 내 전문가 인증 신청 조회·접수 |
| GET | `/api/v1/admin/experts/applications` | 관리자 전문가 신청 목록 |
| PUT | `/api/v1/admin/experts/{id}/verification` | 관리자 전문가 승인·반려 |

전문가 활동 랭킹은 화력 안의 답변·도움돼요·저장·채택 기여도만 나타내며, 의료진의 의학적 실력이나 치료 결과를 평가하지 않습니다. 면허번호 원문은 저장하지 않고 별도 비밀키로 만든 정규화 HMAC-SHA-256만 보관합니다.

### 제품 검색 예시

```text
GET /api/v1/products?query=수분&category=크림&grade=1&page=0&size=12&sort=score&direction=desc
```

- `grade`: `1`~`5`
- `page`: 0부터 시작하며, `size`는 1~50까지 허용
- `sort`: `score`, `price`, `name`, `brand`
- `direction`: `asc`, `desc`

목록 응답은 `content`, `page`, `size`, `totalElements`, `totalPages`, `hasNext`를 포함합니다.

### 성분 검색 예시

```text
GET /api/v1/ingredients?query=판테놀&status=GOOD&tag=장벽&page=0&size=12&sort=name&direction=asc
```

- `status`: `GOOD`, `CAUTION`, `NEUTRAL`
- `tag`: `보습`, `진정`, `장벽`, `피부톤` 등의 기능 태그
- `page`: 0부터 시작하며, `size`는 1~50까지 허용
- `sort`: `name`, `englishName`, `role`, `status`
- `direction`: `asc`, `desc`

목록 응답은 `content`, `page`, `size`, `totalElements`, `totalPages`, `hasNext`를 포함합니다.

### 제품 성분 분석 예시

```text
GET /api/v1/products/birch-cream/ingredients?status=GOOD&tag=보습
```

응답에는 필터 적용 전 기준의 `totalCount`, `goodCount`, `cautionCount`, `neutralCount` 요약과 필터된 `ingredients` 목록이 포함됩니다.

### 회원가입 예시

```json
POST /api/v1/auth/signup
Content-Type: application/json

{
  "nickname": "새봄",
  "email": "newuser@example.com",
  "password": "Flower!123",
  "passwordConfirm": "Flower!123",
  "termsAccepted": true
}
```

성공 시 `201 Created`와 `userId`, `email`, `nickname`, `nextStep`, `createdAt`만 반환합니다. 비밀번호는 BCrypt 해시로만 저장되고 API 응답에는 포함되지 않습니다.

- 닉네임: 2~20자
- 이메일: 올바른 이메일 형식, 최대 254자
- 비밀번호: 8~64자, 영문·숫자·특수문자 각각 1개 이상, 공백 불가
- 비밀번호 확인 일치 및 필수 약관 동의
- 중복 이메일: `409 Conflict`, 오류 코드 `DUPLICATE_EMAIL`
- 입력 오류: `400 Bad Request`, 오류 코드 `VALIDATION_FAILED`와 필드별 `fieldErrors`

### OAuth 초기 설정

`backend/.env.example`의 `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`을 `backend/.env`에 복사해 채웁니다. 두 값이 모두 있으면 `/api/v1/auth/oauth/providers`에서 카카오가 `configured: true`가 되고 프론트 로그인 버튼이 활성화됩니다. 소셜 로그인은 카카오만 허용합니다.

개발자 콘솔에는 아래 콜백 주소를 등록합니다.

```text
http://localhost:8081/login/oauth2/code/kakao
```

- 카카오 로그인 활성화와 Redirect URI 등록 후 REST API 키를 `KAKAO_CLIENT_ID`로 사용합니다. 로그인 식별에는 사용자 정보 응답의 앱별 회원 고유 ID(`id`)만 사용하므로 이메일·닉네임 동의항목은 필수가 아닙니다.
- 운영 환경: `localhost:8081`을 실제 백엔드 HTTPS 주소로 바꾸고 `OAUTH_FRONTEND_BASE_URL`은 Vercel 주소로 설정

OAuth 계정은 `oauth_accounts`에 공급자 사용자 ID와 화력 회원을 분리해 연결합니다. 카카오는 `(KAKAO, 카카오 회원 고유 ID)`를 로그인 키로 사용하며 카카오 이메일이 없거나 바뀌어도 같은 계정으로 처리합니다. 같은 이메일의 기본 계정과 카카오 계정을 자동 연결하지 않으며, 연결이 필요하면 추후 로그인된 상태에서 명시적인 계정 연결 기능으로 처리합니다. 카카오 회원 ID는 앱별 값이므로 운영 DB를 유지하는 동안 같은 Kakao Developers 앱과 REST API 키를 유지해야 합니다.

로그인 시작 때 프론트 서버는 브라우저별 256비트 verifier를 HttpOnly 쿠키에 보관하고 SHA-256 challenge만 백엔드에 전달합니다. 공급자 로그인 완료 후에는 이 challenge에 묶인 120초짜리 일회용 코드만 프론트 서버에 전달하며, 동일 브라우저의 verifier가 일치해야 토큰으로 교환됩니다. 실제 토큰과 verifier는 URL에 노출하지 않습니다.

### 로그인과 토큰 갱신

```json
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "Flower!123"
}
```

성공 응답에는 15분 기본 만료의 `accessToken`, 30일 기본 만료의 `refreshToken`, `user`가 포함됩니다. `/api/v1/auth/me`에는 `Authorization: Bearer <accessToken>` 헤더를 사용합니다. 갱신은 아래처럼 요청합니다.

```json
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "발급받은-리프레시-토큰"
}
```

리프레시 토큰은 요청할 때마다 새 값으로 교체됩니다. 이미 사용한 값을 다시 보내면 탈취 가능성으로 판단해 같은 로그인 묶음을 폐기합니다. DB에는 원문이 아닌 SHA-256 해시만 저장합니다.

운영 환경에서는 `backend/.env.example`을 참고해 최소 32바이트의 임의 `JWT_SECRET`을 설정합니다. `ACCESS_TOKEN_SECONDS`, `REFRESH_TOKEN_SECONDS`, `OAUTH_EXCHANGE_CODE_SECONDS`로 만료 시간을 조절할 수 있습니다.

### 내 피부 프로필

두 API 모두 로그인 응답의 Access Token을 `Authorization: Bearer <accessToken>` 헤더로 보내야 합니다. 아직 프로필이 없으면 조회 결과가 `configured: false`와 빈 `concerns`로 반환됩니다.

```json
PUT /api/v1/users/me/skin-profile
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "skinType": "수부지",
  "hydrationLevel": "LOW",
  "oilinessLevel": "HIGH",
  "sensitivityLevel": "HIGH",
  "breakoutFrequency": "OCCASIONAL",
  "cleansingTightness": "LONG",
  "rednessFrequency": "FREQUENT",
  "poreLevel": "MEDIUM",
  "texturePreference": "LIGHT",
  "routineComplexity": "STANDARD",
  "sunscreenUsage": "DAILY",
  "reactionTriggers": ["향료", "에탄올"],
  "breakoutZones": ["턱·입가"],
  "environments": ["냉난방 건조", "계절 변화"],
  "concerns": ["속건조", "민감", "피부 장벽"]
}
```

- 피부 타입: `건성`, `지성`, `복합성`, `수부지`, `중성`, `민감`
- 수분·유분 상태: `LOW`, `BALANCED`, `HIGH`
- 피부 민감도: `LOW`, `MEDIUM`, `HIGH`
- 트러블 빈도: `RARE`, `OCCASIONAL`, `FREQUENT`
- 세안 후 당김: `NONE`, `SHORT`, `LONG`
- 붉어짐 빈도: `RARE`, `OCCASIONAL`, `FREQUENT`
- 모공 체감: `LOW`, `MEDIUM`, `HIGH`
- 선호 제형: `LIGHT`, `BALANCED`, `RICH`
- 스킨케어 단계: `MINIMAL`, `STANDARD`, `LAYERED`
- 자외선 차단 습관: `RARE`, `SOMETIMES`, `DAILY`
- 반응 유발 요인·트러블 위치·생활 환경은 중복 없이 선택하며 응답에도 입력 순서로 반환됩니다.
- 피부 고민: `속건조`, `민감`, `모공`, `붉은기`, `피부 장벽`, `각질`, `칙칙함`, `탄력` 중 중복 없이 1~4개
- 사용자 ID는 요청에서 받지 않고 Access Token의 회원 ID만 사용합니다.
- 기존 회원의 기본 정보는 유지하고 `profileVersion: 1`로 반환합니다. 새 세부 문항을 저장하면 `profileVersion: 2`가 되어 정밀 프로필과 이전 프로필을 구분할 수 있습니다.
- 저장한 수분·유분·민감도·세안 후 당김·붉어짐·선호 제형·생활 환경은 제품 상세와 비교 화력에 반영되고, 수분·유분·민감도·선호 제형·피부 고민은 나의 랭킹 정렬에도 사용됩니다.
- 반응 유발 요인은 제품에 해당 성분이 있다고 단정하는 값이 아니며, 전성분 확인과 작은 부위 시험 안내를 먼저 보여주기 위한 사용자 관찰 이력입니다.

### 찜한 제품

세 API 모두 Access Token이 필요하며 사용자 ID는 요청값이 아니라 토큰에서 확인합니다. 같은 제품을 여러 번 추가해도 하나만 저장됩니다.

```text
GET /api/v1/users/me/favorites
Authorization: Bearer <accessToken>

PUT /api/v1/users/me/favorites/birch-cream
Authorization: Bearer <accessToken>

DELETE /api/v1/users/me/favorites/birch-cream
Authorization: Bearer <accessToken>
```

목록 응답은 최신 찜 순서의 `content`와 `totalElements`를 포함하며 각 항목에는 `product`, `favoritedAt`이 들어갑니다. 존재하지 않는 제품을 추가하면 `404 RESOURCE_NOT_FOUND`, 로그인 정보가 없거나 유효하지 않으면 `401`을 반환합니다. 찜 취소는 저장된 항목이 없어도 안전하게 완료됩니다.

### 최근 본 제품

두 API 모두 Access Token이 필요하고 사용자 ID는 토큰에서 확인합니다. 제품 상세 화면을 실제로 연 로그인 사용자가 `PUT`을 호출하며, 같은 제품은 중복 저장하지 않고 `viewedAt`만 현재 시각으로 갱신합니다.

```text
GET /api/v1/users/me/recent-products
Authorization: Bearer <accessToken>

PUT /api/v1/users/me/recent-products/birch-cream
Authorization: Bearer <accessToken>
```

목록은 가장 최근에 본 제품 최대 6개를 최신순으로 반환합니다. `totalElements`는 사용자가 본 고유 제품 전체 개수이며 각 항목은 `product`, `viewedAt`을 포함합니다. 등록되지 않은 제품은 `404 RESOURCE_NOT_FOUND`, 로그인 정보가 없거나 유효하지 않으면 `401`을 반환합니다.

### 비교 제품 저장

비교 제품은 로그인 사용자별로 2개 또는 3개를 요청 배열 순서대로 저장합니다. 새 목록을 저장하면 이전 목록 전체를 교체하며 같은 제품을 중복해서 넣을 수 없습니다.

```json
PUT /api/v1/users/me/comparison-products
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "productIds": ["birch-cream", "heartleaf-toner", "rice-sunscreen"]
}
```

성공 응답은 `content`, `totalElements`를 포함하고 각 항목에는 `product`, 1부터 시작하는 `displayOrder`, `savedAt`이 들어갑니다. `GET`은 저장 순서로 목록을 조회하고 `DELETE`는 전체 비교 목록을 비웁니다. 2개 미만·3개 초과는 `400 VALIDATION_FAILED`, 중복 제품은 `400 INVALID_REQUEST`, 존재하지 않거나 비공개인 제품은 `404 RESOURCE_NOT_FOUND`, 로그인 정보가 없으면 `401`을 반환합니다.

### 관심 성분과 성분 화력

관심 성분은 요청 배열의 순서대로 1~10 우선순위를 저장합니다. 빈 배열을 보내면 모두 해제할 수 있으며, 중복되거나 등록되지 않은 성분 ID는 `400 INVALID_REQUEST`를 반환합니다.

```json
PUT /api/v1/users/me/preferred-ingredients
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "ingredientIds": ["niacinamide", "panthenol", "ceramide-np"]
}
```

`GET /api/v1/ingredients/panthenol/firepower`는 제품마다 `firepowerScore`, `confidence`, `concentrationNote`와 `match`, `concentration`, `evidence`, `productType`, `synergy`, `stability`, `dataConfidence` 세부 점수를 반환합니다. 이 점수는 화장품 간 비교 지표이며 의학적 효능을 보장하지 않습니다.

### 관리자 제품 이미지

먼저 관리자 계정의 `users.role`을 `ADMIN`으로 설정한 뒤 다시 로그인해 새 권한이 포함된 Access Token을 발급받습니다.

```sql
UPDATE hwaryeok.users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

S3가 설정된 환경에서 새 관리자 화면은 백엔드를 거치지 않고 Presigned URL로 이미지를 올립니다. PNG·JPG·WEBP만 허용하며 최대 크기는 5MB입니다.

1. `POST /api/v1/admin/products/{productId}/image-upload-url`에 `{"fileName":"product.png","contentType":"image/png","size":12345}`를 보냅니다.
2. 응답의 `uploadUrl`로 파일을 `PUT`하며, `headers`의 모든 헤더를 그대로 적용합니다. URL은 기본 5분 동안 유효하고 `If-None-Match: *`가 서명되어 동일 키를 덮어쓸 수 없습니다. `objectKey`는 `hwaryeok/pending/product-images/...`의 임시 키이며 `Cache-Control: private, no-store`로 서명하고 검증합니다. `imageUrl`은 확정 후 사용할 기존 `https://cdn.hwaryeok.co.kr/products/{productId}/{uuid}.{ext}` 형식입니다.
3. `POST /api/v1/admin/products/{productId}/image-upload-complete`에 `{"objectKey":"..."}`를 보냅니다. 백엔드가 S3 `HeadObject`로 크기·Content-Type·소유 메타데이터·임시 캐시 정책을, Range GET으로 실제 파일 시그니처를 확인합니다. 이후 동일 UUID의 `products/...` 키에 `Cache-Control: public, max-age=31536000, immutable`로 복사가 성공한 뒤에만 `Product.imageUrl`을 저장합니다. PUT 만료 후에도 업로드 완료를 전송할 수 있도록 5분의 확인 유예 시간을 둡니다. pending 객체는 즉시 삭제하지 않아 URL 만료 전 같은 키로 재PUT하면 `If-None-Match: *`에 의해 `412`가 반환되며, 완료 재시도는 같은 pending 객체를 다시 검증해 같은 최종 URL로 멱등적으로 확정합니다.

회원 프로필 사진도 동일한 직접 업로드 구조를 사용하지만 PNG·JPG만 허용합니다. `POST /api/v1/users/me/reviewer-profile/image-upload-url`로 사용자 전용 `hwaryeok/pending/profile-images/{userId}/...` 키를 발급받고, 업로드 후 `POST /api/v1/users/me/reviewer-profile/image-upload-complete`로 확정합니다. 백엔드는 최대 5MB인 객체 전체를 내려받아 JPEG/PNG를 완전히 디코딩하고 가로·세로 각 2,048px 및 총 400만 픽셀 이하인지 확인한 뒤 메타데이터가 제거된 새 이미지로 재인코딩하여 `hwaryeok/profiles/{userId}/...`에 공개합니다. `DELETE /api/v1/users/me/reviewer-profile/image`는 DB 커밋 후 현재 사용자의 기존 객체만 삭제하며, 사진 교체도 새 URL 커밋 이후 이전 객체를 삭제합니다. 삭제한 사진이 CDN에 장기간 남지 않도록 프로필 객체는 1시간 캐시 후 반드시 원본을 재검증하며, 제품 객체의 1년 immutable 정책과 분리합니다.

프로필 사진 Presigned URL은 계정당 하루 20회(한국 시간 기준)까지 발급합니다. 이 횟수는 DB에 저장하고 사용자 행 잠금으로 여러 서버 인스턴스에서도 원자적으로 처리하며, 초과 시 `429 PROFILE_IMAGE_DAILY_LIMIT`와 `Retry-After`를 반환합니다. 운영상 필요하면 `PROFILE_IMAGE_DAILY_PRESIGNED_URL_LIMIT`을 1~100 범위에서 조정할 수 있습니다.

기존 `PUT /api/v1/admin/products/{productId}/image` multipart API는 하위 호환을 위해 유지하지만 `Deprecation: true`와 후속 API `Link` 헤더를 반환합니다. S3 설정이 없는 로컬·테스트 환경에서는 이 기존 API가 PostgreSQL `product_images`와 `/api/v1/media/products/{productId}`를 계속 사용합니다. 일반 사용자는 관리자 API 호출 시 `403`을 반환합니다.

화력 운영값은 `S3_BUCKET=fatell-aws-s3`, `S3_KEY_PREFIX=hwaryeok`, `S3_PUBLIC_BASE_URL=https://cdn.hwaryeok.co.kr`, `AWS_REGION=ap-northeast-2`입니다. CDN 배포의 Origin Path는 `/hwaryeok`을 가리켜야 공개 URL과 S3 객체 키가 일치합니다. 배포 서버는 IAM 역할 사용을 권장하며, 로컬에서만 필요한 AWS 키는 Git에 포함되지 않는 `.env`에 저장합니다.

Presigned PUT을 브라우저에서 사용하려면 S3 버킷 CORS에 로컬과 운영 프론트 출처를 모두 추가해야 합니다. 운영 도메인은 실제 값으로 바꾸세요.

```json
[
  {
    "AllowedOrigins": ["http://localhost:3001", "https://your-production-frontend.example"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 300
  }
]
```

백엔드 IAM 역할은 객체 ARN에 `s3:PutObject`(임시 PUT 서명·제품 Copy 대상·프로필 안전 재인코딩 대상), `s3:GetObject`(Head·Range/전체 GET·Copy 원본), `s3:DeleteObject`(교체·삭제된 공개 프로필 사진 정리)를 허용해야 합니다. 객체 리소스는 `hwaryeok/pending/product-images/*`, `hwaryeok/products/*`, `hwaryeok/pending/profile-images/*`, `hwaryeok/profiles/*`로 제한하세요. S3는 `s3:ListBucket`이 없으면 없는 객체의 `HeadObject`도 `404` 대신 `403`으로 응답할 수 있으므로, 버킷 ARN에 `s3:ListBucket`을 허용하되 같은 네 prefix에 `s3:prefix` 조건을 두세요. AWS IAM에는 별도의 `s3:CopyObject` action이 없습니다.

`hwaryeok/pending/product-images/`와 `hwaryeok/pending/profile-images/` prefix에는 1일 후 삭제하는 S3 lifecycle을 반드시 추가해 완료·중단된 임시 업로드를 자동 정리하세요. 애플리케이션은 Presigned URL의 유효 시간과 멱등적 완료 재시도를 위해 pending 객체를 즉시 삭제하지 않습니다. 이 lifecycle을 적용하지 않으면 pending 객체가 계속 누적됩니다.

```json
{
  "Rules": [
    {
      "ID": "expire-hwaryeok-pending-product-images",
      "Status": "Enabled",
      "Filter": {"Prefix": "hwaryeok/pending/product-images/"},
      "Expiration": {"Days": 1}
    },
    {
      "ID": "expire-hwaryeok-pending-profile-images",
      "Status": "Enabled",
      "Filter": {"Prefix": "hwaryeok/pending/profile-images/"},
      "Expiration": {"Days": 1}
    }
  ]
}
```

CDN은 `/products/**`와 `/profiles/**`만 공개 이미지 경로로 허용하고 `/pending/**`는 캐시 동작/원본 정책에서 차단하세요. URL 발급 API 응답은 `Cache-Control: no-store`로 반환됩니다.

기존 `frontend/public/products` 정적 이미지는 아래 명령으로 `hwaryeok/products/`에 이관합니다. 첫 번째 명령은 변경 없는 드라이런이고, 두 번째 명령만 실제 업로드를 수행합니다. 동일한 크기·형식·캐시 정책의 객체는 건너뛰며 로컬 원본과 DB 데이터는 삭제하지 않습니다.

```powershell
.\gradlew.bat --no-daemon migrateLegacyProductImages
.\gradlew.bat --no-daemon migrateLegacyProductImages -PapplyMigration=true
```

### 화력 분석 예시

```json
POST /api/v1/analyses/preview
Content-Type: application/json

{
  "productId": "birch-cream",
  "skinType": "수부지",
  "concerns": ["속건조", "민감", "피부 장벽"]
}
```

오류는 `code`, `message`, `path`, `fieldErrors`가 포함된 동일한 JSON 형식으로 반환됩니다.
