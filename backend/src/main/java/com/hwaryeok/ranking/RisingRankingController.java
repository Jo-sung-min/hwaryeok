package com.hwaryeok.ranking;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hwaryeok.ranking.RisingRankingDtos.RankingResponse;

@RestController
@RequestMapping("/api/v1/rankings/rising")
public class RisingRankingController {

    private final RisingRankingService rankingService;

    public RisingRankingController(RisingRankingService rankingService) {
        this.rankingService = rankingService;
    }

    @GetMapping
    public RankingResponse rank(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return rankingService.rank(category, page, size);
    }
}
