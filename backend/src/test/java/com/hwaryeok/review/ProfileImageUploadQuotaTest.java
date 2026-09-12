package com.hwaryeok.review;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:profile-image-quota;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "app.reviewer-profile.image.daily-presigned-url-limit=2"
})
class ProfileImageUploadQuotaTest {

    @Autowired private ProfileImageUploadQuota quota;
    @Autowired private JdbcTemplate jdbc;

    private String userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status)
                VALUES (?, ?, 'unused', ?, ?, 'USER', 'ACTIVE')
                """, userId, userId + "@example.com",
                "쿼터 테스트 " + userId.substring(0, 8), "quota-" + userId);
    }

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM users WHERE id = ?", userId);
    }

    @Test
    void concurrentIssuanceNeverExceedsThePersistentDailyLimit() throws Exception {
        try (var executor = Executors.newFixedThreadPool(3)) {
            var barrier = new CyclicBarrier(3);
            var attempts = java.util.stream.IntStream.range(0, 3)
                    .mapToObj(ignored -> executor.submit(() -> {
                        barrier.await();
                        try {
                            quota.reserve(userId);
                            return true;
                        } catch (ProfileImageUploadQuotaExceededException exception) {
                            return false;
                        }
                    }))
                    .toList();

            long accepted = 0;
            for (var attempt : attempts) if (attempt.get(20, TimeUnit.SECONDS)) accepted++;
            assertThat(accepted).isEqualTo(2);
        }

        assertThat(jdbc.queryForObject(
                "SELECT issued_count FROM profile_image_upload_usage WHERE user_id = ?", Integer.class, userId
        )).isEqualTo(2);
        assertThatThrownBy(() -> quota.reserve(userId))
                .isInstanceOf(ProfileImageUploadQuotaExceededException.class)
                .extracting("retryAfterSeconds")
                .asInstanceOf(org.assertj.core.api.InstanceOfAssertFactories.LONG)
                .isPositive();
    }

    @Test
    void aStoredPreviousDayCountResetsInsteadOfAccumulatingForever() {
        LocalDate yesterday = Instant.now().atZone(ProfileImageUploadQuota.ZONE).toLocalDate().minusDays(1);
        jdbc.update("""
                INSERT INTO profile_image_upload_usage (user_id, usage_date, issued_count, updated_at)
                VALUES (?, ?, 2, CURRENT_TIMESTAMP)
                """, userId, java.sql.Date.valueOf(yesterday));

        quota.reserve(userId);

        assertThat(jdbc.queryForObject(
                "SELECT issued_count FROM profile_image_upload_usage WHERE user_id = ?", Integer.class, userId
        )).isEqualTo(1);
    }
}
