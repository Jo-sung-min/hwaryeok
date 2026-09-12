# 화력 운영 배포 가이드

화력은 Next.js 프론트엔드, Spring Boot API, PostgreSQL을 서로 분리해 배포한다. 가장 단순한 운영 형태는 각 서비스를 한 인스턴스로 실행하고 HTTPS 역방향 프록시 뒤에 두는 구성이다.

## 1. 배포 전 필수 조건

- 프론트엔드와 백엔드에 각각 고정된 HTTPS 도메인을 준비한다.
- PostgreSQL 백업·복구가 가능한 관리형 데이터베이스 또는 영속 볼륨을 사용한다.
- `JWT_SECRET`과 `LICENSE_HASH_SECRET`은 서로 다른 32바이트 이상의 임의 값으로 만든다.
- `.env` 파일과 실제 OAuth 비밀키는 저장소나 Docker 이미지에 포함하지 않는다.
- 다중 Next.js 인스턴스를 운영하면 모든 인스턴스에 같은 `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`와 배포 식별자를 사용하고 공유 캐시 전략을 별도로 구성한다.

## 2. 운영 환경 변수

### 프론트엔드

| 변수 | 예시 | 용도 |
| --- | --- | --- |
| `API_URL` | `https://api.example.com/api/v1` | Next.js 서버가 호출할 내부·공개 API 주소 |
| `NEXT_PUBLIC_API_URL` | `https://api.example.com/api/v1` | 제품 이미지 등 브라우저에 공개되는 API 주소. Docker 빌드 시 고정 |
| `NEXT_PUBLIC_SITE_URL` | `https://example.com` | canonical, Open Graph, robots, sitemap 기준 주소. Docker 빌드 시 고정 |
| `OAUTH_BACKEND_URL` | `https://api.example.com` | OAuth 인증 시작용 공개 백엔드 주소 |
| `S3_PUBLIC_BASE_URL` | `https://cdn.hwaryeok.co.kr` | 제품 이미지 CDN 허용 주소. 프론트 빌드 시 고정 |

### 백엔드

| 변수 | 설명 |
| --- | --- |
| `SPRING_PROFILES_ACTIVE=postgres` | PostgreSQL 운영 프로필 활성화 |
| `DB_URL`, `DB_SCHEMA`, `DB_USER`, `DB_PASSWORD` | 운영 데이터베이스 연결 정보 |
| `DB_POOL_MAX_SIZE`, `DB_POOL_MIN_IDLE` | 인스턴스 수와 DB 연결 한도에 맞춘 풀 크기 |
| `CORS_ALLOWED_ORIGINS` | 실제 프론트 HTTPS 주소. 여러 개면 쉼표로 구분 |
| `OAUTH_FRONTEND_BASE_URL` | OAuth 완료 후 돌아갈 실제 프론트 주소 |
| `JWT_SECRET`, `LICENSE_HASH_SECRET` | 서로 다른 32바이트 이상의 비밀키 |
| `ADMIN_EMAILS` | 관리자 역할을 부여할 이메일 목록 |
| `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` | 카카오 REST API 키와 클라이언트 시크릿 |
| `SESSION_COOKIE_SAME_SITE`, `SESSION_COOKIE_SECURE` | 서로 다른 HTTPS 도메인이면 `none`, `true` 검토 |
| `S3_BUCKET` | S3 버킷명만 입력. 화력은 `fatell-aws-s3` |
| `S3_KEY_PREFIX` | 버킷 안 객체 접두사. 화력은 `hwaryeok` |
| `S3_PUBLIC_BASE_URL` | `S3_KEY_PREFIX`를 Origin Path로 연결한 공개 CDN 주소 |
| `AWS_REGION` | S3 버킷 리전. 화력 버킷은 `ap-northeast-2` |
| `S3_PRESIGNED_URL_SECONDS` | 브라우저 직접 업로드 URL 유효 시간. 기본 300초, 허용 60~900초 |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` | IAM 역할을 쓸 수 없는 로컬 환경에서만 설정하는 AWS 자격증명 |

`S3_BUCKET`에는 `fatell-aws-s3.s3.amazonaws.com/hwaryeok` 같은 호스트·경로를 넣지 않는다. 버킷명과 경로를 각각 `S3_BUCKET=fatell-aws-s3`, `S3_KEY_PREFIX=hwaryeok`으로 분리한다. 운영에서는 정적 키보다 인스턴스 역할 등 AWS 기본 자격증명 체인을 우선 사용하고 실제 키를 저장소나 Docker 이미지에 넣지 않는다.

관리자 이미지는 Presigned PUT으로 `hwaryeok/pending/product-images/` 아래에 올라간 뒤 검증·Copy가 성공해야 `hwaryeok/products/` 공개 경로에 확정된다. pending 객체는 URL 만료 전 재PUT을 막기 위해 즉시 삭제하지 않고 1일 lifecycle로만 정리한다. lifecycle이 없으면 임시 객체가 누적되므로 반드시 설정한다. 버킷 CORS에 프론트 출처의 `PUT`과 서명 헤더를 허용하고 CDN `/pending/**`는 차단한다. IAM은 객체 prefix에 `s3:PutObject`, `s3:GetObject`, 버킷에 prefix 조건을 둔 `s3:ListBucket`을 최소 범위로 허용한다.

## 3. Docker Compose 실행

개발·단일 서버 검증용으로 세 서비스를 함께 실행할 수 있다.

```bash
cp .env.example .env
# .env의 DB_PASSWORD, JWT_SECRET, LICENSE_HASH_SECRET을 임의 값으로 교체
docker compose build
docker compose up -d
docker compose ps
```

기본 공개 주소는 프론트 `http://localhost:3001`, API `http://localhost:8081`이다. PostgreSQL은 호스트의 loopback에만 바인딩되고 데이터는 `hwaryeok-postgres-data` 볼륨에 남는다. 운영에서는 프론트와 API 포트를 인터넷에 직접 노출하지 말고 HTTPS 역방향 프록시나 관리형 로드 밸런서 뒤에 둔다.

배포 상태는 다음 경로로 확인한다.

```text
GET https://api.example.com/actuator/health
GET https://example.com/robots.txt
GET https://example.com/sitemap.xml
```

## 4. 분리 배포

프론트는 Vercel 또는 Node.js 22 컨테이너에 배포할 수 있다. Vercel에서는 Root Directory를 `frontend`로 지정하고 프론트 환경 변수 표의 값을 환경별로 등록한다. 백엔드는 Java 21 컨테이너를 실행할 수 있는 서비스에 배포하고 PostgreSQL과 같은 리전에 둔다.

카카오 개발자 콘솔의 로그인 Redirect URI는 다음 형식으로 등록한다.

```text
https://api.example.com/login/oauth2/code/kakao
```

## 5. 마이그레이션과 배포 순서

1. 운영 DB 스냅샷 또는 백업을 만든다.
2. 백엔드 새 이미지를 한 인스턴스에 배포한다. 시작 시 Flyway가 순서대로 마이그레이션한다.
3. `/actuator/health`와 핵심 공개 API, 로그인 API를 확인한다.

`V39`는 배포 순간 남아 있을 수 있는 120초짜리 OAuth 교환 코드를 폐기하고 브라우저 시도값 열을 필수로 추가합니다. 구버전 백엔드와 동시에 쓰는 롤링 배포는 호환되지 않으므로, 이 버전은 백엔드 트래픽을 잠시 중단한 원자 배포 또는 단일 인스턴스 교체로 적용합니다.
4. CDN의 Origin Path가 S3의 `/hwaryeok`을 가리키고 `https://cdn.hwaryeok.co.kr/products/...`가 공개 조회되는지 확인한다.
5. `NEXT_PUBLIC_*` 및 `S3_PUBLIC_BASE_URL` 값이 반영된 프론트 이미지를 빌드해 배포한다.
6. 로그인, 제품 상세, 비교 저장, 관리자 이미지 업로드 흐름을 스모크 테스트한다.

Flyway가 실패하면 새 백엔드 인스턴스를 트래픽에 연결하지 않는다. 이미 적용된 마이그레이션 파일은 수정하지 말고 후속 마이그레이션으로 교정한다.

## 6. 롤백과 백업

- 애플리케이션 오류만 있고 DB 변경이 하위 호환이면 직전 프론트·백엔드 이미지로 되돌린다.
- 파괴적 DB 변경은 자동 롤백하지 않는다. 사전 백업에서 별도 DB로 복구하고 데이터 차이를 확인한 뒤 전환한다.
- 신규 제품 이미지는 S3 버전 관리·수명 주기·백업 정책에 포함하고, 레거시 제품 이미지는 PostgreSQL 백업 범위에도 포함한다.
- 배포 버전, 적용된 Flyway 버전, 스모크 테스트 결과를 배포 기록에 남긴다.

## 7. 운영 점검 목록

- HTTPS 강제, 보안 헤더, 요청 크기 제한, 속도 제한은 역방향 프록시에서도 적용한다.
- 백엔드 Hikari 최대 연결 수 × 백엔드 인스턴스 수가 DB 허용 연결 수보다 작아야 한다.
- 관리자와 OAuth 계정은 배포 후 다시 로그인해 최신 역할·설정이 토큰에 반영됐는지 확인한다.
- 로그에 Access/Refresh Token, OAuth 비밀키, 면허번호 원문이 남지 않는지 확인한다.
- DB 백업 복구 훈련과 로그인·비교·리뷰·관리자 흐름 점검을 정기적으로 수행한다.
