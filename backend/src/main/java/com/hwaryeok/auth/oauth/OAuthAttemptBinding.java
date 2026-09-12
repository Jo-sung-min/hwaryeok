package com.hwaryeok.auth.oauth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;

public final class OAuthAttemptBinding {

    public static final String CHALLENGE_PARAMETER = "attempt_challenge";
    public static final String AUTHORIZATION_ATTRIBUTE = OAuthAttemptBinding.class.getName() + ".CHALLENGE";
    public static final String CALLBACK_REQUEST_ATTRIBUTE = OAuthAttemptBinding.class.getName() + ".CALLBACK_CHALLENGE";

    private static final Pattern BASE64_URL_32_BYTES = Pattern.compile("^[A-Za-z0-9_-]{43}$");

    private OAuthAttemptBinding() {
    }

    public static boolean isValidChallenge(String challenge) {
        return challenge != null && BASE64_URL_32_BYTES.matcher(challenge).matches();
    }

    public static boolean isValidVerifier(String verifier) {
        return verifier != null && BASE64_URL_32_BYTES.matcher(verifier).matches();
    }

    public static String challengeForVerifier(String verifier) {
        if (!isValidVerifier(verifier)) {
            throw new IllegalArgumentException("OAuth attempt verifier is invalid");
        }
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(verifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public static boolean matches(String storedChallenge, String presentedChallenge) {
        if (!isValidChallenge(storedChallenge) || !isValidChallenge(presentedChallenge)) return false;
        return MessageDigest.isEqual(
                storedChallenge.getBytes(StandardCharsets.US_ASCII),
                presentedChallenge.getBytes(StandardCharsets.US_ASCII)
        );
    }

    public static String callbackChallenge(HttpServletRequest request) {
        Object challenge = request.getAttribute(CALLBACK_REQUEST_ATTRIBUTE);
        return challenge instanceof String value && isValidChallenge(value) ? value : null;
    }
}
