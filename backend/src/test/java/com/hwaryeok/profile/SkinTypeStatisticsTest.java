package com.hwaryeok.profile;

import static org.assertj.core.api.Assertions.assertThat;
import java.time.Instant;
import java.util.UUID;
import com.hwaryeok.user.User;
import com.hwaryeok.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:skin-type-statistics;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@Transactional
class SkinTypeStatisticsTest {
    @Autowired UserRepository users;
    @Autowired UserSkinProfileRepository profiles;
    @Autowired SkinTypeStatisticsController controller;

    @Test void hidesSmallSampleAndCountsOnlyEligibleLatestProfiles() {
        assertThat(controller.get().status()).isEqualTo("COLLECTING");
        assertThat(controller.get().sampleSize()).isNull();
        assertThat(controller.get().distribution()).isEmpty();
        for (int i = 0; i < 30; i++) add(i < 12 ? "복합성" : "건성", "USER", "ACTIVE", true);
        add("지성", "ADMIN", "ACTIVE", true);
        add("지성", "USER", "WITHDRAWN", true);
        add("지성", "USER", "ACTIVE", false);
        var statistics = controller.get();
        assertThat(statistics.status()).isEqualTo("AVAILABLE");
        assertThat(statistics.sampleSize()).isEqualTo(30L);
        var combination = statistics.distribution().stream().filter(row -> row.skinType().equals("복합성")).findFirst().orElseThrow();
        assertThat(combination.count()).isEqualTo(12);
        assertThat(combination.percentage()).isEqualTo(40.0);
        assertThat(statistics.distribution().stream().mapToLong(SkinTypeStatisticsController.Share::count).sum()).isEqualTo(30);
    }

    private void add(String type, String role, String status, boolean saved) {
        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        users.saveAndFlush(new User(id, id + "@example.test", "unused", "통계 테스트", role, status, now, now));
        UserSkinProfile profile = new UserSkinProfile(id, type, now, now);
        if (saved) profile.update(type, "BALANCED", "BALANCED", "MEDIUM", "RARE", "NONE", "RARE", "LOW", "LIGHT", "MINIMAL", "DAILY", now);
        profiles.saveAndFlush(profile);
    }
}
