# 화력(HWA:RYEOK) 모노레포

개인 피부 타입과 고민에 따라 화장품의 **화력 등급**과 **피부 적합도**를 제공하는 서비스입니다.

## 저장소 구조

```text
hwaryeok/
├─ frontend/             Next.js 16 · React 19 · Tailwind CSS
│  ├─ src/
│  ├─ public/
│  ├─ package.json
│  ├─ .env.example
│  └─ vercel.json
├─ backend/              Spring Boot 4.1 · Java 21 · Gradle Wrapper 8.14.3
│  ├─ src/
│  ├─ build.gradle
│  ├─ gradlew / gradlew.bat
│  └─ .env.example
├─ docker-compose.yml    PostgreSQL 개발 환경
├─ .env.example          PostgreSQL 컨테이너 환경 변수 예시
└─ plan.md               구현 체크리스트와 작업 기록
```

프론트와 백엔드는 의존성, 환경 변수, 빌드 명령을 공유하지 않습니다. Next.js는 PostgreSQL에 직접 접근하지 않고 Spring Boot REST API만 호출합니다.

## 로컬 실행

### 1. PostgreSQL (PostgreSQL 연동을 확인할 때)

```bash
cp .env.example .env
# .env의 DB_PASSWORD를 임의의 값으로 교체
docker compose up -d postgres
```

Windows PowerShell에서는 `Copy-Item .env.example .env`를 사용합니다.

### 2. 백엔드

```bash
cd backend
cp .env.example .env
# backend/.env의 DB_PASSWORD를 PostgreSQL과 같은 값으로 설정
./gradlew bootRun --args="--spring.profiles.active=postgres"
```

Windows PowerShell에서는 `Copy-Item .env.example .env`와 `./gradlew.bat bootRun --args="--spring.profiles.active=postgres"`를 사용합니다. `.env`의 `DB_PASSWORD`, `JWT_SECRET`, `LICENSE_HASH_SECRET` 예시값은 반드시 임의 값으로 교체해야 합니다.

백엔드는 `backend/.env`를 자동으로 읽습니다. `DB_SCHEMA`에 사용할 PostgreSQL 스키마 이름을 지정하면 Flyway와 Hibernate가 같은 스키마를 사용합니다. 로컬 PostgreSQL 기본 양식은 `backend/.env.example`에서 확인할 수 있습니다.

PostgreSQL 없이 빠르게 개발 화면만 확인할 때는 환경 파일 없이 `./gradlew bootRun`을 실행하면 됩니다. 별도 프로필이 없을 때만 개발 전용 `local` 프로필(H2, 개발용 키)이 자동 적용되며 운영 JAR에는 이 기본값이 적용되지 않습니다.

### 3. 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

- 프론트엔드: `http://localhost:3000`
- 백엔드: `http://localhost:8080`
- 상태 확인: `http://localhost:8080/actuator/health`

## Vercel 배포

Vercel에서 Git 저장소를 가져온 뒤 다음처럼 설정합니다.

1. **Root Directory:** `frontend`
2. **Framework Preset:** Next.js
3. **Build Command:** `npm run build` — 자동 감지값 사용 가능
4. **Environment Variable:** `API_URL=https://<배포한-백엔드-주소>/api/v1`
5. **OAuth Environment Variable:** `OAUTH_BACKEND_URL=https://<배포한-백엔드-주소>`
6. 브라우저 직접 호출 기능을 사용할 때만 `NEXT_PUBLIC_API_URL`도 같은 공개 API 주소로 설정

`API_URL`은 Vercel의 Production, Preview, Development 환경에 각각 등록하는 것을 권장합니다. 브라우저가 백엔드를 직접 호출하는 기능을 배포할 때는 백엔드의 `CORS_ALLOWED_ORIGINS`에 실제 Vercel 도메인을 쉼표로 구분해 추가합니다.

카카오·네이버·구글 로그인 키는 프론트나 Vercel에 두지 않고 백엔드 환경변수에만 저장합니다. 공급자 개발자 콘솔의 Redirect URI는 `https://<백엔드주소>/login/oauth2/code/{provider}`이며, 백엔드의 `OAUTH_FRONTEND_BASE_URL`에는 실제 Vercel 주소를 설정합니다.

로그인 토큰도 프론트 브라우저 코드에 노출하지 않습니다. Vercel의 Next.js 서버가 백엔드와 통신한 뒤 Access/Refresh Token을 HttpOnly 쿠키에 보관합니다. 백엔드 운영 환경에는 서로 다른 32바이트 이상의 임의 `JWT_SECRET`, `LICENSE_HASH_SECRET`을 반드시 등록하세요. 두 값이 없거나 짧으면 백엔드는 시작되지 않습니다.

관리자 제품 이미지는 백엔드와 PostgreSQL에 저장되므로 Vercel에는 별도 이미지 저장소 환경 변수가 필요하지 않습니다. 운영 관리자 지정과 이미지 API 사용법은 [backend/README.md](backend/README.md#관리자-제품-이미지)를 참고하세요.

## 검증

```bash
cd frontend
npm run typecheck
npm run build

cd ../backend
./gradlew clean build
```

백엔드 API 문서는 [backend/README.md](backend/README.md), 전체 진행 상태는 [plan.md](plan.md)를 참고합니다.

샘플 제품에는 화해 공개 급상승 랭킹을 화력 형식으로 변환한 16종이 포함됩니다. 수집 범위, 변환 규칙, 재수집 방법은 [backend/README.md](backend/README.md#화해-공개-랭킹-샘플-데이터)에 기록되어 있습니다.
