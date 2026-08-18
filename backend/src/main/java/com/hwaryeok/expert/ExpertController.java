package com.hwaryeok.expert;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/experts")
public class ExpertController {

    private final ExpertService expertService;

    public ExpertController(ExpertService expertService) {
        this.expertService = expertService;
    }

    @GetMapping
    public List<ExpertSummaryResponse> findAll(@RequestParam(required = false) String topic) {
        return expertService.findExperts(topic);
    }

    @GetMapping("/rankings")
    public ExpertRankingResponse rankings(
            @RequestParam(defaultValue = "MONTH") String period,
            @RequestParam(required = false) String topic
    ) {
        return expertService.rankings(period, topic);
    }

    @GetMapping("/{slug}")
    public ExpertDetailResponse findOne(@PathVariable String slug) {
        return expertService.findExpert(slug);
    }
}
