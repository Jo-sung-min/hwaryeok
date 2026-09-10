package com.hwaryeok.photo;

import com.hwaryeok.user.ActiveUserService;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SkinPhotoQuota {
    private final JdbcTemplate jdbc;
    private final ActiveUserService users;
    private final int limit;
    static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    public SkinPhotoQuota(JdbcTemplate jdbc, ActiveUserService users,
                         @Value("${OPENAI_SKIN_PHOTO_DAILY_LIMIT:3}") int limit) {
        this.jdbc = jdbc;
        this.users = users;
        this.limit = Math.max(1, Math.min(10, limit));
    }
    public int limit() { return limit; }

    @Transactional(readOnly = true)
    public int remaining(String userId) {
        users.requireActive(userId);
        var counts = jdbc.queryForList("SELECT request_count FROM skin_photo_usage WHERE user_id = ? AND usage_date = ?",
                Integer.class, userId, Date.valueOf(Instant.now().atZone(ZONE).toLocalDate()));
        return Math.max(0, limit - (counts.isEmpty() ? 0 : counts.getFirst()));
    }

    @Transactional
    public void reserve(String userId) { reserveAt(userId, Instant.now()); }

    void reserveAt(String userId, Instant now) {
        // Lock the existing user even on the first request; protects quota across instances.
        users.requireActiveForUpdate(userId);
        var today = now.atZone(ZONE).toLocalDate();
        var rows = jdbc.query("SELECT usage_date, request_count, last_requested_at FROM skin_photo_usage WHERE user_id = ?",
                (rs, row) -> new Usage(rs.getDate(1).toLocalDate(), rs.getInt(2), rs.getTimestamp(3).toInstant()), userId);
        int count = 0;
        if (!rows.isEmpty()) {
            var usage = rows.getFirst();
            count = usage.date().equals(today) ? usage.count() : 0;
            if (count >= limit) throw new PhotoAnalysisException(429, "DAILY_LIMIT", "오늘의 사진 분석 횟수를 모두 사용했어요. 내일 다시 이용해 주세요.");
            if (now.isBefore(usage.last().plusSeconds(60))) throw new PhotoAnalysisException(429, "COOLDOWN", "이전 요청 후 1분이 지나면 다시 분석할 수 있어요.");
            jdbc.update("UPDATE skin_photo_usage SET usage_date = ?, request_count = ?, last_requested_at = ? WHERE user_id = ?", Date.valueOf(today), count + 1, Timestamp.from(now), userId);
        } else {
            jdbc.update("INSERT INTO skin_photo_usage (user_id, usage_date, request_count, last_requested_at) VALUES (?, ?, ?, ?)", userId, Date.valueOf(today), 1, Timestamp.from(now));
        }
    }
    record Usage(java.time.LocalDate date, int count, Instant last) {}
}
