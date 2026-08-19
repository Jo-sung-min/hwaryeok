package com.hwaryeok.auth;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import com.hwaryeok.auth.token.TokenHashService;
import com.hwaryeok.common.config.DatabaseDialect;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoginRateLimitService {

    private final JdbcTemplate jdbc;
    private final TokenHashService tokenHashService;
    private final DatabaseDialect databaseDialect;
    private final Duration window;
    private final Duration blockDuration;
    private final int identityLimit;
    private final int addressLimit;

    public LoginRateLimitService(
            JdbcTemplate jdbc,
            TokenHashService tokenHashService,
            DatabaseDialect databaseDialect,
            @Value("${app.auth.login-rate-limit.window-seconds:900}") long windowSeconds,
            @Value("${app.auth.login-rate-limit.block-seconds:900}") long blockSeconds,
            @Value("${app.auth.login-rate-limit.identity-attempts:8}") int identityLimit,
            @Value("${app.auth.login-rate-limit.address-attempts:100}") int addressLimit
    ) {
        this.jdbc = jdbc;
        this.tokenHashService = tokenHashService;
        this.databaseDialect = databaseDialect;
        this.window = Duration.ofSeconds(windowSeconds);
        this.blockDuration = Duration.ofSeconds(blockSeconds);
        this.identityLimit = identityLimit;
        this.addressLimit = addressLimit;
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public void checkAllowed(String normalizedEmail, String clientAddress) {
        Instant now = Instant.now();
        String address = normalizeAddress(clientAddress);
        Instant identityBlockedUntil = findBlockedUntil("identity:" + normalizedEmail, now);
        Instant addressBlockedUntil = findBlockedUntil("address:" + address, now);
        Instant blockedUntil = later(identityBlockedUntil, addressBlockedUntil);
        if (blockedUntil != null) throw blocked(blockedUntil, now);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = TooManyLoginAttemptsException.class)
    public void registerFailure(String normalizedEmail, String clientAddress) {
        Instant now = Instant.now();
        String address = normalizeAddress(clientAddress);
        Instant identityBlockedUntil = register("identity:" + normalizedEmail, identityLimit, now);
        Instant addressBlockedUntil = register("address:" + address, addressLimit, now);
        jdbc.update("DELETE FROM auth_login_attempts WHERE updated_at < ?", now.minus(7, ChronoUnit.DAYS));
        Instant blockedUntil = later(identityBlockedUntil, addressBlockedUntil);
        if (blockedUntil != null) throw blocked(blockedUntil, now);
    }

    @Transactional
    public void clearSuccessfulIdentity(String normalizedEmail) {
        jdbc.update(
                "DELETE FROM auth_login_attempts WHERE key_hash = ?",
                tokenHashService.hash("identity:" + normalizedEmail)
        );
    }

    private Instant register(String rawKey, int limit, Instant now) {
        String keyHash = tokenHashService.hash(rawKey);
        insertIfAbsent(keyHash, now);
        Attempt attempt = jdbc.queryForObject("""
                SELECT attempt_count, window_started, blocked_until
                FROM auth_login_attempts
                WHERE key_hash = ?
                FOR UPDATE
                """, (rs, rowNum) -> new Attempt(
                rs.getInt("attempt_count"),
                rs.getTimestamp("window_started").toInstant(),
                rs.getTimestamp("blocked_until") == null ? null : rs.getTimestamp("blocked_until").toInstant()
        ), keyHash);
        if (attempt == null) throw new IllegalStateException("로그인 제한 상태를 확인하지 못했어요.");

        if (attempt.blockedUntil() != null && attempt.blockedUntil().isAfter(now)) return attempt.blockedUntil();
        boolean expiredWindow = !attempt.windowStarted().plus(window).isAfter(now);
        int nextCount = expiredWindow ? 1 : attempt.count() + 1;
        Instant windowStarted = expiredWindow ? now : attempt.windowStarted();
        Instant blockedUntil = nextCount > limit ? now.plus(blockDuration) : null;
        jdbc.update("""
                UPDATE auth_login_attempts
                SET attempt_count = ?, window_started = ?, blocked_until = ?, updated_at = ?
                WHERE key_hash = ?
                """, nextCount, windowStarted, blockedUntil, now, keyHash);
        return blockedUntil;
    }

    private Instant findBlockedUntil(String rawKey, Instant now) {
        return jdbc.query(
                "SELECT blocked_until FROM auth_login_attempts WHERE key_hash = ?",
                rs -> {
                    if (!rs.next()) return null;
                    var value = rs.getTimestamp("blocked_until");
                    if (value == null) return null;
                    Instant blockedUntil = value.toInstant();
                    return blockedUntil.isAfter(now) ? blockedUntil : null;
                },
                tokenHashService.hash(rawKey)
        );
    }

    private void insertIfAbsent(String keyHash, Instant now) {
        if (databaseDialect.isPostgresql()) {
            jdbc.update("""
                    INSERT INTO auth_login_attempts
                        (key_hash, attempt_count, window_started, blocked_until, updated_at)
                    VALUES (?, 0, ?, NULL, ?)
                    ON CONFLICT (key_hash) DO NOTHING
                    """, keyHash, now, now);
            return;
        }
        jdbc.update("""
                INSERT INTO auth_login_attempts
                    (key_hash, attempt_count, window_started, blocked_until, updated_at)
                SELECT ?, 0, ?, NULL, ?
                WHERE NOT EXISTS (SELECT 1 FROM auth_login_attempts WHERE key_hash = ?)
                """, keyHash, now, now, keyHash);
    }

    private TooManyLoginAttemptsException blocked(Instant blockedUntil, Instant now) {
        return new TooManyLoginAttemptsException(Duration.between(now, blockedUntil).toSeconds());
    }

    private String normalizeAddress(String clientAddress) {
        return clientAddress == null || clientAddress.isBlank() ? "unknown" : clientAddress;
    }

    private Instant later(Instant first, Instant second) {
        if (first == null) return second;
        if (second == null) return first;
        return first.isAfter(second) ? first : second;
    }

    private record Attempt(int count, Instant windowStarted, Instant blockedUntil) {
    }
}
