package com.hwaryeok.review;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import com.hwaryeok.user.ActiveUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileImageUploadQuota {

    static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    static final int DEFAULT_DAILY_LIMIT = 20;
    static final int MAX_DAILY_LIMIT = 100;

    private final JdbcTemplate jdbc;
    private final ActiveUserService activeUserService;
    private final int dailyLimit;
    private final Clock clock;

    @Autowired
    public ProfileImageUploadQuota(
            JdbcTemplate jdbc,
            ActiveUserService activeUserService,
            @Value("${app.reviewer-profile.image.daily-presigned-url-limit:20}") int dailyLimit
    ) {
        this(jdbc, activeUserService, dailyLimit, Clock.systemUTC());
    }

    ProfileImageUploadQuota(
            JdbcTemplate jdbc,
            ActiveUserService activeUserService,
            int dailyLimit,
            Clock clock
    ) {
        if (dailyLimit < 1 || dailyLimit > MAX_DAILY_LIMIT) {
            throw new IllegalStateException(
                    "PROFILE_IMAGE_DAILY_PRESIGNED_URL_LIMIT는 1 이상 100 이하로 지정해 주세요."
            );
        }
        this.jdbc = jdbc;
        this.activeUserService = activeUserService;
        this.dailyLimit = dailyLimit;
        this.clock = clock;
    }

    public int dailyLimit() {
        return dailyLimit;
    }

    @Transactional
    public void reserve(String userId) {
        reserveAt(userId, clock.instant());
    }

    void reserveAt(String userId, Instant now) {
        // The stable parent row exists before the first quota row. Locking it serializes
        // issuance across every application instance without relying on process memory.
        activeUserService.requireActiveForUpdate(userId);
        LocalDate today = now.atZone(ZONE).toLocalDate();
        var rows = jdbc.query(
                "SELECT usage_date, issued_count FROM profile_image_upload_usage WHERE user_id = ?",
                (rs, rowNum) -> new Usage(rs.getDate("usage_date").toLocalDate(), rs.getInt("issued_count")),
                userId
        );
        if (rows.isEmpty()) {
            jdbc.update("""
                    INSERT INTO profile_image_upload_usage (user_id, usage_date, issued_count, updated_at)
                    VALUES (?, ?, 1, ?)
                    """, userId, Date.valueOf(today), Timestamp.from(now));
            return;
        }

        Usage usage = rows.getFirst();
        int current = usage.date().equals(today) ? usage.count() : 0;
        if (current >= dailyLimit) {
            throw new ProfileImageUploadQuotaExceededException(retryAfterSeconds(now, today));
        }
        jdbc.update("""
                UPDATE profile_image_upload_usage
                SET usage_date = ?, issued_count = ?, updated_at = ?
                WHERE user_id = ?
                """, Date.valueOf(today), current + 1, Timestamp.from(now), userId);
    }

    private long retryAfterSeconds(Instant now, LocalDate today) {
        Instant nextDay = today.plusDays(1).atStartOfDay(ZONE).toInstant();
        return Math.max(1, Duration.between(now, nextDay).toSeconds());
    }

    private record Usage(LocalDate date, int count) {
    }
}
