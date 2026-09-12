package com.hwaryeok.review;

public class ProfileImageUploadQuotaExceededException extends RuntimeException {

    private final long retryAfterSeconds;

    public ProfileImageUploadQuotaExceededException(long retryAfterSeconds) {
        super("오늘 발급할 수 있는 프로필 사진 업로드 횟수를 모두 사용했어요. 내일 다시 이용해 주세요.");
        this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
