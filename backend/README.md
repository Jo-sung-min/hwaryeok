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

Docker 없이 화면 연동을 빠르게 확인할 때만 개발용 H2 프로필을 사용할 수 있습니다.

```bash
gradlew.bat bootRun --args="--spring.profiles.active=local"
```

`local` 프로필의 데이터는 서버를 종료하면 사라지며, 실제 개발·운영 데이터베이스는 PostgreSQL을 사용합니다.

## 핵심 API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/actuator/health` | 서버 상태 확인 |
| GET | `/api/v1/products` | 제품 목록·검색·필터 |
| GET | `/api/v1/products/{id}` | 제품 상세 |
| GET | `/api/v1/products/{id}/ingredients` | 제품별 성분 요약·필터 |
| GET | `/api/v1/products/ranking` | 피부 타입별 랭킹 |
| GET | `/api/v1/ingredients` | 성분 검색·필터·페이지네이션·정렬 |
| GET | `/api/v1/ingredients/{id}` | 성분 상세와 포함 제품 |
| POST | `/api/v1/analyses/preview` | 피부 프로필 기반 화력 분석 |

### 제품 검색 예시

```text
GET /api/v1/products?query=수분&category=크림&grade=1
```

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
