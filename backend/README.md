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
| GET | `/api/v1/products/ranking` | 피부 타입별 랭킹 |
| POST | `/api/v1/analyses/preview` | 피부 프로필 기반 화력 분석 |

### 제품 검색 예시

```text
GET /api/v1/products?query=수분&category=크림&grade=1
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
