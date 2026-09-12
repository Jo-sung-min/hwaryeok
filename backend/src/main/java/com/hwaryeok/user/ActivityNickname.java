package com.hwaryeok.user;

import java.text.Normalizer;
import java.util.Locale;

public final class ActivityNickname {

    public static final int MIN_CODE_POINTS = 2;
    public static final int MAX_CODE_POINTS = 20;

    private ActivityNickname() {
    }

    public static String normalize(String raw) {
        if (raw == null) throw invalid();
        String value = Normalizer.normalize(raw, Normalizer.Form.NFKC).strip().replaceAll("\\s+", " ");
        int length = value.codePointCount(0, value.length());
        if (length < MIN_CODE_POINTS || length > MAX_CODE_POINTS || value.codePoints().anyMatch(ActivityNickname::isUnsafe)) {
            throw invalid();
        }
        return value;
    }

    public static String key(String normalizedNickname) {
        return Normalizer.normalize(normalizedNickname, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT);
    }

    public static String uniqueCandidate(String rawBase, java.util.function.Predicate<String> keyAlreadyUsed) {
        String base = normalizeOrFallback(rawBase);
        if (!keyAlreadyUsed.test(key(base))) return base;
        for (int number = 2; number < 100_000; number++) {
            String suffix = " ·" + number;
            int available = MAX_CODE_POINTS - suffix.codePointCount(0, suffix.length());
            String candidate = truncate(base, available) + suffix;
            if (!keyAlreadyUsed.test(key(candidate))) return candidate;
        }
        throw new IllegalStateException("사용할 수 있는 활동명을 만들지 못했어요.");
    }

    private static String normalizeOrFallback(String raw) {
        try {
            return normalize(raw);
        } catch (IllegalArgumentException exception) {
            return "화력 회원";
        }
    }

    private static String truncate(String value, int maxCodePoints) {
        int count = value.codePointCount(0, value.length());
        return count <= maxCodePoints ? value : value.substring(0, value.offsetByCodePoints(0, maxCodePoints));
    }

    private static boolean isUnsafe(int codePoint) {
        return Character.isISOControl(codePoint) || Character.getType(codePoint) == Character.FORMAT;
    }

    private static IllegalArgumentException invalid() {
        return new IllegalArgumentException("활동명은 2~20자로 입력해 주세요.");
    }
}
