package com.hwaryeok.photo;

import static org.assertj.core.api.Assertions.*;
import java.time.Instant;
import java.util.UUID;
import com.hwaryeok.user.User;
import com.hwaryeok.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {"OPENAI_SKIN_PHOTO_ENABLED=false", "OPENAI_API_KEY=", "OPENAI_SKIN_PHOTO_DAILY_LIMIT=3"})
@Transactional
class SkinPhotoQuotaTest {
    @Autowired SkinPhotoQuota quota;
    @Autowired UserRepository users;
    @Test void enforcesCooldownDailyLimitAndKoreanMidnightReset() {
        String id = UUID.randomUUID().toString();
        Instant now = Instant.parse("2026-09-10T14:50:00Z");
        users.saveAndFlush(new User(id, id + "@example.test", "unused", "사진 테스트", "USER", "ACTIVE", now, now));
        quota.reserveAt(id, now);
        assertThatThrownBy(() -> quota.reserveAt(id, now.plusSeconds(59))).hasMessageContaining("1분");
        quota.reserveAt(id, now.plusSeconds(60));
        quota.reserveAt(id, now.plusSeconds(120));
        assertThatThrownBy(() -> quota.reserveAt(id, now.plusSeconds(180))).hasMessageContaining("내일");
        quota.reserveAt(id, Instant.parse("2026-09-10T15:00:00Z"));
    }
    @Test void rejectsInactiveAndUnknownAccounts() {
        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        users.saveAndFlush(new User(id, id + "@example.test", "unused", "사진 테스트", "USER", "SUSPENDED", now, now));
        assertThatThrownBy(() -> quota.reserveAt(id, now)).isInstanceOf(RuntimeException.class);
        assertThatThrownBy(() -> quota.remaining("not-a-user")).isInstanceOf(RuntimeException.class);
    }
}
