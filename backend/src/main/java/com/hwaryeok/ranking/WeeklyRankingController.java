package com.hwaryeok.ranking;

import com.hwaryeok.ranking.WeeklyRankingDtos.RankingResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rankings/weekly")
public class WeeklyRankingController {

    private final WeeklyRankingService rankingService;

    public WeeklyRankingController(WeeklyRankingService rankingService) {
        this.rankingService = rankingService;
    }

    @GetMapping
    public RankingResponse current() {
        return rankingService.current();
    }
}
