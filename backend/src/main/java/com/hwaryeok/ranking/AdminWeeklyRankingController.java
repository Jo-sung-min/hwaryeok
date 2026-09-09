package com.hwaryeok.ranking;

import com.hwaryeok.ranking.WeeklyRankingDtos.RankingResponse;
import com.hwaryeok.ranking.WeeklyRankingDtos.UpdateRequest;
import com.hwaryeok.user.ActiveUserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/weekly-ranking")
public class AdminWeeklyRankingController {

    private final WeeklyRankingService rankingService;
    private final ActiveUserService activeUserService;

    public AdminWeeklyRankingController(
            WeeklyRankingService rankingService,
            ActiveUserService activeUserService
    ) {
        this.rankingService = rankingService;
        this.activeUserService = activeUserService;
    }

    @GetMapping
    public RankingResponse current(@AuthenticationPrincipal Jwt jwt) {
        activeUserService.requireAdmin(jwt.getSubject());
        return rankingService.current();
    }

    @PutMapping
    public RankingResponse replace(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateRequest request
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return rankingService.replace(request);
    }

    @DeleteMapping
    public RankingResponse reset(@AuthenticationPrincipal Jwt jwt) {
        activeUserService.requireAdmin(jwt.getSubject());
        return rankingService.reset();
    }
}
