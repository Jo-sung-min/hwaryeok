# 화력 API

Spring Boot 4.1, Java 21, PostgreSQL 기반 REST API입니다.

## 실행

프로젝트 루트에서 PostgreSQL을 시작합니다.

```bash
docker compose up -d postgres
```

백엔드를 실행합니다.

```bash
cd backend
./gradlew bootRun
```

Windows에서는 `gradlew.bat bootRun`을 사용합니다. 기본 주소는 `http://localhost:8080`입니다.

백엔드는 실행 위치에 따라 `backend/.env` 또는 저장소 루트의 `.env`를 자동으로 읽습니다. 처음에는 `backend/.env.example`을 복사하고 접속 정보를 입력합니다.

```text
DB_URL=jdbc:postgresql://호스트:5432/데이터베이스명
DB_USER=데이터베이스사용자
DB_PASSWORD=데이터베이스비밀번호
DB_SCHEMA=hwaryeok
```

시작할 때 Flyway가 `DB_SCHEMA`를 생성하고 마이그레이션을 적용하며, Hibernate는 같은 스키마를 검증해 사용합니다.
Spring Boot 4의 Flyway 자동 구성은 `spring-boot-starter-flyway`로 활성화되어 Hibernate보다 먼저 실행됩니다.

이미 적용된 `V1__create_products.sql`은 체크섬이 바뀌지 않도록 수정하지 않습니다. 이후 DB 구조 변경은 `V2__...sql`처럼 새 버전 마이그레이션으로 추가합니다.

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
| GET | `/oauth2/authorization/{provider}` | OAuth 로그인 시작 (`google`, `kakao`, `naver`) |
| GET | `/login/oauth2/code/{provider}` | 공급자 OAuth 콜백 |
| GET | `/api/v1/auth/me` | Bearer Token 현재 사용자 확인 |
| GET | `/api/v1/products` | 제품 검색·필터·페이지네이션·정렬 |
| GET | `/api/v1/products/{id}` | 제품 상세 |
| GET | `/api/v1/products/{id}/ingredients` | 제품별 성분 요약·필터 |
| GET | `/api/v1/products/ranking` | 피부 타입별 랭킹 |
| GET | `/api/v1/ingredients` | 성분 검색·필터·페이지네이션·정렬 |
| GET | `/api/v1/ingredients/{id}` | 성분 상세와 포함 제품 |
| POST | `/api/v1/analyses/preview` | 피부 프로필 기반 화력 분석 |

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

`backend/.env.example`의 공급자별 `CLIENT_ID`, `CLIENT_SECRET`을 `backend/.env`에 복사해 채웁니다. 두 값이 모두 있는 공급자만 `/api/v1/auth/oauth/providers`에서 `configured: true`가 되고 프론트 로그인 버튼이 활성화됩니다.

개발자 콘솔에는 아래 콜백 주소를 등록합니다.

```text
Google  http://localhost:8080/login/oauth2/code/google
Kakao   http://localhost:8080/login/oauth2/code/kakao
Naver   http://localhost:8080/login/oauth2/code/naver
```

- Google: OAuth 동의 화면의 `email`, `profile` 범위와 웹 애플리케이션 클라이언트 사용
- Kakao: 카카오 로그인 활성화, `닉네임`·`카카오계정(이메일)` 동의항목 설정, REST API 키를 `KAKAO_CLIENT_ID`로 사용
- Naver: 서비스 URL과 Callback URL을 등록하고 회원 정보의 이메일·별명 또는 이름 제공 설정
- 운영 환경: `localhost:8080`을 실제 백엔드 HTTPS 주소로 바꾸고 `OAUTH_FRONTEND_BASE_URL`은 Vercel 주소로 설정

OAuth 계정은 `oauth_accounts`에 공급자 사용자 ID와 화력 회원을 분리해 연결합니다. 같은 이메일의 기존 계정은 보안을 위해 자동 연결하지 않으며, 추후 로그인된 상태에서 계정 연결 기능으로 처리합니다. 공급자 로그인 완료 후에는 120초짜리 일회용 코드만 프론트 서버에 전달하며 실제 토큰은 URL에 노출하지 않습니다.

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
  "concerns": ["속건조", "민감", "피부 장벽"]
}
```

- 피부 타입: `건성`, `지성`, `복합성`, `수부지`, `중성`, `민감`
- 피부 고민: `속건조`, `민감`, `모공`, `붉은기`, `피부 장벽`, `각질`, `칙칙함`, `탄력` 중 중복 없이 1~4개
- 사용자 ID는 요청에서 받지 않고 Access Token의 회원 ID만 사용합니다.
- 저장한 피부 타입·고민은 제품 상세·비교 분석에 사용되며, 피부 타입은 나의 피부 랭킹의 기본값으로 사용됩니다.

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
