package com.hwaryeok.auth.oauth;

import java.util.Locale;
import java.util.Map;

public record OAuthProfile(OAuthProvider provider, String providerUserId, String email, String nickname) {

    public static OAuthProfile from(String registrationId, Map<String, Object> attributes) {
        OAuthProvider provider = OAuthProvider.fromRegistrationId(registrationId);
        return switch (provider) {
            case GOOGLE -> google(attributes);
            case KAKAO -> kakao(attributes);
            case NAVER -> naver(attributes);
        };
    }

    private static OAuthProfile google(Map<String, Object> attributes) {
        if (!booleanValue(attributes.get("email_verified"))) {
            throw new OAuthLoginException("email_not_verified", "확인된 구글 이메일이 필요해요.");
        }
        return createWithRequiredEmail(
                OAuthProvider.GOOGLE,
                stringValue(attributes.get("sub")),
                stringValue(attributes.get("email")),
                stringValue(attributes.get("name"))
        );
    }

    private static OAuthProfile kakao(Map<String, Object> attributes) {
        Map<String, Object> account = mapValue(attributes.get("kakao_account"));
        Map<String, Object> profile = mapValue(account.get("profile"));
        return createWithOptionalEmail(
                OAuthProvider.KAKAO,
                stringValue(attributes.get("id")),
                verifiedKakaoEmail(account),
                stringValue(profile.get("nickname"))
        );
    }

    private static OAuthProfile naver(Map<String, Object> attributes) {
        Map<String, Object> response = mapValue(attributes.get("response"));
        String nickname = firstNotBlank(stringValue(response.get("nickname")), stringValue(response.get("name")));
        return createWithRequiredEmail(
                OAuthProvider.NAVER,
                stringValue(response.get("id")),
                stringValue(response.get("email")),
                nickname
        );
    }

    private static OAuthProfile createWithRequiredEmail(
            OAuthProvider provider,
            String providerUserId,
            String email,
            String nickname
    ) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) {
            throw new OAuthLoginException("email_required", "로그인 제공자에서 올바른 이메일을 받지 못했어요.");
        }
        return create(provider, providerUserId, normalizedEmail, nickname);
    }

    private static OAuthProfile createWithOptionalEmail(
            OAuthProvider provider,
            String providerUserId,
            String email,
            String nickname
    ) {
        return create(provider, providerUserId, normalizeEmail(email), nickname);
    }

    private static OAuthProfile create(
            OAuthProvider provider,
            String providerUserId,
            String normalizedEmail,
            String nickname
    ) {
        String normalizedProviderUserId = stringValue(providerUserId);
        if (normalizedProviderUserId.isBlank() || normalizedProviderUserId.length() > 255) {
            throw new OAuthLoginException("profile_missing", "소셜 계정 식별 정보를 불러오지 못했어요.");
        }
        String emailNickname = normalizedEmail == null ? "" : normalizedEmail.split("@", 2)[0];
        String normalizedNickname = firstNotBlank(stringValue(nickname), emailNickname, provider.displayName() + " 회원");
        if (normalizedNickname.length() > 20) normalizedNickname = normalizedNickname.substring(0, 20);
        return new OAuthProfile(provider, normalizedProviderUserId, normalizedEmail, normalizedNickname);
    }

    private static String verifiedKakaoEmail(Map<String, Object> account) {
        if (!booleanValue(account.get("is_email_verified"))) return null;
        if (account.containsKey("is_email_valid") && !booleanValue(account.get("is_email_valid"))) return null;
        return stringValue(account.get("email"));
    }

    private static String normalizeEmail(String email) {
        String normalizedEmail = stringValue(email).toLowerCase(Locale.ROOT);
        if (normalizedEmail.isBlank()
                || normalizedEmail.length() > 254
                || !normalizedEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            return null;
        }
        return normalizedEmail;
    }

    private static String firstNotBlank(String... values) {
        for (String value : values) if (value != null && !value.isBlank()) return value;
        return "화력 회원";
    }

    private static String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value).strip();
    }

    private static boolean booleanValue(Object value) {
        return value instanceof Boolean flag ? flag : Boolean.parseBoolean(stringValue(value));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> mapValue(Object value) {
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }
}
