-- 비밀번호 로그인은 계속 이메일을 사용하지만, 카카오는 앱별 회원 고유 ID로 식별합니다.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE oauth_accounts ALTER COLUMN email DROP NOT NULL;
