-- 배포 직전 120초 동안 발급된 구형 교환 코드는 브라우저 시도값에 묶여 있지 않으므로 폐기합니다.
DELETE FROM oauth_exchange_codes;

ALTER TABLE oauth_exchange_codes
    ADD COLUMN attempt_challenge VARCHAR(43) NOT NULL;
