# 화력 전체 아키텍처·보안 감사

- 감사일: 2026-08-19
- 범위: Next.js 16 / React 19, Spring Boot 4.1 / Spring Security / JPA·JdbcTemplate, PostgreSQL / Flyway, Docker Compose와 환경 변수
- 방법: 전체 소스·마이그레이션·설정 정적 검토, 의존성 트리와 보안 공지 확인, 통합 테스트·동시성 회귀 테스트·프로덕션 빌드 실행

## 결론

발견한 Critical 2건과 High 12건은 모두 코드와 설정에 반영했다. 인증 비밀값 기본값, 공개 DB 기본 계정, 일회용 토큰 경쟁 조건, 로그인 무차별 대입, stale JWT 관리자 권한, 면허번호 결정적 해시, N+1과 전체 리뷰 적재, 중복 API 호출, 부분 저장 트랜잭션이 핵심 위험이었다.

Medium/Low는 즉시 장애나 권한 탈취로 이어지는 항목은 아니지만 데이터와 트래픽이 커지기 전에 후속 작업이 필요하다.

## Critical — 수정 완료

| ID | 범주 | 발견 내용 | 적용한 수정 |
|---|---|---|---|
| C-01 | 보안·배포 | 운영에서도 예측 가능한 로컬 JWT 비밀값과 비보안 세션 쿠키가 기본값이었다. 토큰 위조 시 관리자 권한까지 획득할 수 있었다. | JWT/면허 키를 필수화하고 32바이트·기본값 검증을 시작 시 수행한다. 운영 세션 쿠키는 Secure 기본값으로 바꿨다. local/test 프로필만 별도 개발 키와 비보안 쿠키를 쓴다. |
| C-02 | 보안·배포 | PostgreSQL이 모든 인터페이스에 기본 비밀번호로 노출될 수 있었다. | `DB_PASSWORD`를 필수화하고 Compose 포트를 `127.0.0.1`에만 바인딩했다. 예시 파일과 실행 문서에서도 기본 비밀번호를 제거했다. |

## High — 수정 완료

| ID | 범주 | 발견 내용 | 적용한 수정 |
|---|---|---|---|
| H-01 | 보안·트랜잭션 | refresh token과 OAuth 교환 코드를 동시에 요청하면 일회용 값이 둘 이상 성공할 수 있었다. | 두 조회에 비관적 행 잠금을 추가했다. 동일 refresh token 동시 요청은 정확히 한 건만 성공하는 회귀 테스트를 추가했다. |
| H-02 | 보안·권한 | JWT의 15분 된 role/status만 신뢰해 관리자 강등·계정 정지 직후에도 민감 작업이 가능했다. | `ActiveUserService`를 도입해 개인 쓰기와 관리자 API가 현재 DB의 ACTIVE/ADMIN 상태를 다시 확인하도록 했다. |
| H-03 | 보안 | 비밀번호 로그인에 시도 제한이 없어 온라인 무차별 대입과 credential stuffing이 가능했다. | PostgreSQL 공유 상태 기반 이메일/IP 제한, 해시 키, 429와 `Retry-After`, 만료 정리를 추가했다. 성공 로그인은 실패 횟수에 포함하지 않는다. 9번째 실패 차단 테스트를 추가했다. |
| H-04 | 개인정보·XSS | 면허번호가 비밀키 없는 SHA-256이라 작은 후보군을 사전 대입할 수 있었고, 홈페이지 URL 스킴 제한도 없었다. | 별도 키 HMAC-SHA-256으로 교체하고 기존 SHA 값의 중복 검사 호환성을 유지했다. 홈페이지는 HTTP(S)만 허용한다. |
| H-05 | 공급망 | pgJDBC 42.7.11은 `channelBinding=require` 사용 시 보안 다운그레이드 취약 버전이었다. | 42.7.12로 명시 고정했다. 공식 공지: <https://jdbc.postgresql.org/security/> |
| H-06 | N+1·성능 | 전문가 목록/랭킹/답변/신청 조회가 전문가마다 주제·근무지·통계를 반복 조회했다. | 행 매퍼 내부 조회를 제거하고 ID 묶음별 주제·근무지·통계·사용자 반응을 일괄 조회하도록 재구성했다. |
| H-07 | N+1·성능 | 성분 화력 집계가 제품별 count를 반복했고 리뷰 요약은 모든 리뷰와 모든 점수를 메모리에 적재했다. | 제품별 집계 쿼리, 리뷰 count/AVG/항목별 GROUP BY, 최근 5개 제한, Hibernate batch fetch를 적용했다. |
| H-08 | 불필요 API·성능 | 제품 상세가 제품·분석·리뷰 기준·최대 50개 제품을 중복 호출했고 전문가 홈도 전문가 목록을 다시 호출했다. | 분석 응답에 제품을 포함하고 관련 제품 전용 제한 API를 추가했다. 리뷰 응답에 기준 메타데이터를 포함하고 랭킹 응답을 재사용했다. |
| H-09 | 트랜잭션 | 피부 프로필과 관심 성분을 프런트에서 두 API로 병렬 저장해 한쪽만 성공할 수 있었다. | 하나의 `@Transactional` 프로필 저장 API로 합쳤다. 두 번째 저장 실패 시 첫 번째 저장도 롤백되는 통합 테스트를 추가했다. |
| H-10 | 동시성·정합성 | 리뷰 중복 생성, 전문가 반응 카운터, 답변 채택이 검사 후 쓰기 경쟁 조건을 가졌다. | 사용자/질문 행 잠금으로 직렬화하고 실제 insert/delete 건수에만 카운터를 변경한다. 채택도 질문 잠금 안에서 처리한다. |
| H-11 | 예외·트랜잭션 | PostgreSQL unique 위반을 catch한 뒤 같은 트랜잭션에서 재조회하는 코드가 있어 `transaction is aborted` 500으로 바뀔 수 있었다. | 회원가입·OAuth·전문가 신청의 무결성 예외를 트랜잭션 안전한 도메인 오류로 즉시 변환했다. |
| H-12 | 예외처리 | 잘못된 JSON/타입/멀티파트와 예상 밖 예외의 일관된 응답·서버 로그가 없었다. | 400/429/프레임워크 상태 보존 매핑과 안전한 500 응답, 서버 stack trace 로깅을 추가했다. 내부 예외 내용은 응답에 노출하지 않는다. |

## Medium — 후속 개선 필요

| ID | 범주 | 현재 위험 | 권장 조치 |
|---|---|---|---|
| M-01 | 성능 | 개인화 랭킹은 `products.findAll()` 후 JVM에서 전 제품을 채점·정렬한다. 현재 22개에서는 작지만 카탈로그 증가 시 선형 CPU/메모리 병목이다. | 채점 규칙을 SQL/물질화 뷰 또는 사전 계산 테이블로 옮기고 top-N만 조회한다. |
| M-02 | PostgreSQL | 제품·성분 검색이 `%query%`/`LOWER`라 B-tree 인덱스를 사용하기 어렵다. | `pg_trgm`과 GIN 인덱스, 최소 검색 길이, 실행 계획 회귀 검사를 도입한다. |
| M-03 | PostgreSQL·배포 | 최대 5MB 이미지를 `BYTEA`로 DB/애플리케이션 메모리에 싣는다. 백업·복제·heap 부담이 함께 증가한다. | S3 호환 오브젝트 스토리지+CDN으로 옮기고 DB에는 버전 URL/메타데이터만 저장한다. |
| M-04 | API | 질문은 임시 `LIMIT 100`, 전문가/신청 목록은 페이지 계약이 없다. 데이터가 커지면 응답이 잘리거나 커진다. | cursor pagination과 총 개수/다음 cursor 계약을 추가한다. |
| M-05 | 유지보수 | `ExpertService`가 조회, 랭킹, 신청, 검증, Q&A, 반응과 SQL을 한 클래스에서 담당한다. | ExpertQuery/Ranking/Application/QnA/Reaction 서비스와 repository로 분리한다. |
| M-06 | 중복 코드 | 제품 점수 보정 로직이 `ProductService`와 `AnalysisService`에 나뉘어 결과가 어긋날 수 있다. | 순수 `ScoringPolicy` 도메인 컴포넌트 하나로 통합하고 golden test를 둔다. |
| M-07 | 유지보수 | 리뷰 카테고리/피부 선택지/홈 제품 일부가 프런트 상수와 백엔드 데이터에 중복된다. | 백엔드 메타데이터 API 또는 생성된 공유 스키마를 단일 원천으로 사용한다. |
| M-08 | 불필요 API | `/my`는 프로필·즐겨찾기·관심 성분·최근 제품 4회를 호출하고 일부 server action은 본 요청 전 `/auth/me`를 호출한다. | `/users/me/dashboard` BFF 응답과 401 기반 토큰 갱신 흐름을 검토한다. |
| M-09 | 보안·성능 | 로그인 제한은 앱 인스턴스 간 공유되지만 매 실패마다 DB 행 잠금/정리를 사용하며 실제 클라이언트 IP는 신뢰 프록시 설정에 의존한다. | CDN/WAF 1차 제한, 검증된 forwarded-header 설정, 주기 배치 cleanup으로 보완한다. |
| M-10 | 프런트 보안 | Next 응답에 명시적 CSP, frame-ancestors, Referrer-Policy, HSTS 정책이 없다. | nonce/hash 기반 CSP와 보안 헤더를 배포 도메인·OAuth 흐름에 맞춰 단계적으로 적용한다. |
| M-11 | 배포 | 운영 `API_URL`/`NEXT_PUBLIC_API_URL` 누락 시 localhost로 조용히 fallback하여 빌드는 성공하지만 런타임이 고장난다. | production/preview 환경에서 필수 환경 변수 검증을 빌드 전에 수행한다. |
| M-12 | PostgreSQL 보안 | DB URL이 TLS 검증을 강제하지 않는다. 관리형 DB 설정 오류 시 평문 또는 서버 검증 없는 연결이 가능하다. | 운영 `DB_URL`에 공급자 권장 `sslmode=verify-full`과 CA 구성을 강제한다. |
| M-13 | 배포 | 백엔드 Dockerfile/Kubernetes·플랫폼 명세와 CI가 없다. 로컬 Gradle 버전과 운영 Java 차이도 자동 검증하지 않는다. | Java 21 고정 multi-stage 이미지, non-root 실행, CI의 test/build/audit, SBOM·이미지 스캔을 추가한다. |
| M-14 | 트랜잭션·배포 | 모든 인스턴스가 시작하면서 Flyway를 실행한다. 무중단 배포의 하위 호환 migration 규칙도 문서화되지 않았다. | release job에서 migration을 한 번 실행하고 expand/contract 규칙을 도입한다. |
| M-15 | 공급망 | `postgres:17-alpine`은 mutable tag다. 같은 배포 정의가 시간에 따라 다른 이미지를 받을 수 있다. | 검증한 patch 버전과 digest로 고정하고 갱신 자동화를 둔다. |
| M-16 | 데이터 수명 | refresh token/OAuth 교환 코드에는 만료 레코드 purge 작업이 없다. | 인덱스가 있는 만료시각 기준 배치 삭제와 보존기간을 운영 작업으로 추가한다. |
| M-17 | 저장소 구조 | `backend/bin` class와 `tsconfig.tsbuildinfo`가 이미 Git에 추적돼 소스 diff를 오염시킨다. | 후속 커밋에서 인덱스에서 제거한다. `.gitignore`에는 새 산출물이 들어오지 않도록 반영했다. |
| M-18 | 계정 모델 | 동일 이메일의 비밀번호 계정과 OAuth 계정을 안전하게 연결하는 명시적 사용자 확인 흐름이 없다. | 재인증 기반 account-linking과 provider 충돌 정책을 설계한다. |

## Low — 품질 백로그

| ID | 범주 | 현재 위험 | 권장 조치 |
|---|---|---|---|
| L-01 | 성능 | 운영 Hibernate `format_sql`이 활성화돼 있다. | local 프로필로만 이동한다. |
| L-02 | 캐시 | 제품 이미지 URL이 불변 버전 없이 1시간 public cache라 교체 직후 오래된 이미지가 보일 수 있다. | content hash/version URL과 ETag/If-None-Match를 사용한다. |
| L-03 | CORS | 허용 origin은 제한하지만 request header는 `*`다. | 실제 사용하는 Authorization/Content-Type 헤더만 허용한다. |
| L-04 | 관측성 | health 외에 API latency, DB pool, query count, 오류율에 대한 대시보드·알림 기준이 없다. | Micrometer 지표, 구조화 로그 correlation ID, tracing과 SLO를 추가한다. |
| L-05 | 데이터 중복 | 홈의 마케팅 수치와 일부 제품 표시는 정적 샘플이라 실제 DB와 달라질 수 있다. | 운영 수치 API 또는 명확한 정적 카피로 분리한다. |
| L-06 | 테스트 | 백엔드 통합 테스트는 있으나 프런트 컴포넌트/브라우저 E2E 자동화가 없다. | 핵심 로그인·프로필·제품 상세·전문가 흐름에 Playwright smoke test를 추가한다. |

## 10개 요청 범주 대응표

| 요청 범주 | 주요 결과 |
|---|---|
| 1. 잘못된 아키텍처 | H-08, H-09 수정; M-05, M-06, M-07, M-13 후속 |
| 2. 보안 취약점 | C-01, C-02, H-01~H-05, H-10~H-12 수정; M-09~M-12 후속 |
| 3. 성능 병목 | H-06~H-08 수정; M-01~M-04 후속 |
| 4. N+1 쿼리 | 전문가·성분·리뷰 N+1 제거, Hibernate batch fetch 추가 |
| 5. 불필요한 API 호출 | 제품 상세·리뷰 기준·전문가 홈 호출 제거; M-08 후속 |
| 6. 예외처리 누락 | H-11, H-12 수정 |
| 7. 중복 코드 | ActiveUser 공통화; M-06, M-07 후속 |
| 8. 어려운 구조 | 조회 mapper 내부 SQL 제거; M-05 중심 후속 |
| 9. 트랜잭션 문제 | H-01, H-09~H-11 수정; M-14 후속 |
| 10. 배포 문제 | C-01, C-02, H-05 수정; M-10~M-17 후속 |

## 검증 결과

- 백엔드 전체 테스트: `gradle test --rerun-tasks` — 33 tests, 성공
- 백엔드 배포 산출물: `gradle build` — 성공
- 프런트 프로덕션 빌드: `npm run build` — 21개 App Router 페이지 생성, 성공
- 프런트 의존성 감사: `npm audit --json` — 취약점 0건
- Gradle 의존성 확인: pgJDBC 42.7.12 선택 확인
- 변경 diff 검사: whitespace error 없음

참고: 자동화된 정적 검토와 통합 테스트는 실제 운영 트래픽의 부하 시험, 외부 침투 시험, PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` 실측을 대체하지 않는다. M-01~M-04는 운영과 유사한 데이터 규모에서 성능 예산을 정해 별도 검증해야 한다.
