package com.hwaryeok.review;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reviewers")
public class ReviewerRankingController {
    private final ReviewReputationService service;

    public ReviewerRankingController(ReviewReputationService service) { this.service = service; }

    @GetMapping("/ranking")
    public ReviewerRankingResponse ranking(@RequestParam(required = false) String skinType,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return service.ranking(skinType, page, size);
    }

    @GetMapping("/{userId}/profile")
    public ReviewerProfileResponse profile(@PathVariable String userId) { return service.profile(userId); }
}
