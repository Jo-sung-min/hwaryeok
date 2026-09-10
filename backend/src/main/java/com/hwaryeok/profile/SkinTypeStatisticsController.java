package com.hwaryeok.profile;

import java.time.Instant;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

/** Public aggregate only: never exposes account IDs, answers or small-sample counts. */
@RestController
public class SkinTypeStatisticsController {
    private static final int MINIMUM_SAMPLE = 30;
    private final UserSkinProfileRepository repository;

    public SkinTypeStatisticsController(UserSkinProfileRepository repository) {
        this.repository = repository;
    }

    public record Share(String skinType, long count, double percentage) {}
    public record Statistics(String status, int minimumSample, Long sampleSize, List<Share> distribution, Instant calculatedAt) {}

    @GetMapping("/api/v1/skin-check/statistics")
    @Transactional(readOnly = true)
    public Statistics get() {
        var counts = repository.countSavedSkinTypes();
        long total = counts.stream().mapToLong(UserSkinProfileRepository.TypeCount::getProfileCount).sum();
        if (total < MINIMUM_SAMPLE) return new Statistics("COLLECTING", MINIMUM_SAMPLE, null, List.of(), Instant.now());
        var distribution = List.of("건성", "지성", "복합성", "수부지", "중성", "민감").stream().map(type -> {
            long count = counts.stream().filter(row -> type.equals(row.getSkinType())).mapToLong(UserSkinProfileRepository.TypeCount::getProfileCount).sum();
            return new Share(type, count, Math.round(count * 1000.0 / total) / 10.0);
        }).toList();
        return new Statistics("AVAILABLE", MINIMUM_SAMPLE, total, distribution, Instant.now());
    }
}
