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
├─ backend/              Spring Boot 4.1 · Java 21 · Gradle 9.6
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

### 1. PostgreSQL

```bash
docker compose up -d postgres
```

### 2. 백엔드

```bash
cd backend
./gradlew bootRun
```

Windows PowerShell에서는 `./gradlew.bat bootRun`을 사용합니다. Docker 없이 빠르게 확인하려면 다음 개발 전용 명령을 사용할 수 있습니다.

```bash
./gradlew.bat bootRun --args="--spring.profiles.active=local"
```

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
5. 브라우저 직접 호출 기능을 사용할 때만 `NEXT_PUBLIC_API_URL`도 같은 공개 API 주소로 설정

`API_URL`은 Vercel의 Production, Preview, Development 환경에 각각 등록하는 것을 권장합니다. 브라우저가 백엔드를 직접 호출하는 기능을 배포할 때는 백엔드의 `CORS_ALLOWED_ORIGINS`에 실제 Vercel 도메인을 쉼표로 구분해 추가합니다.

## 검증

```bash
cd frontend
npm run typecheck
npm run build

cd ../backend
./gradlew clean build
```

백엔드 API 문서는 [backend/README.md](backend/README.md), 전체 진행 상태는 [plan.md](plan.md)를 참고합니다.
