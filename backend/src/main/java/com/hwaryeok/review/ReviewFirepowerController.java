package com.hwaryeok.review;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reviews/{reviewId}/firepower")
public class ReviewFirepowerController {
    private final ReviewReputationService service;

    public ReviewFirepowerController(ReviewReputationService service) { this.service = service; }

    @GetMapping
    public ReviewCommunityRatingResponse summary(@PathVariable String reviewId, @AuthenticationPrincipal Jwt jwt) {
        return service.summary(reviewId, jwt == null ? null : jwt.getSubject());
    }

    @PutMapping
    public ReviewCommunityRatingResponse rate(@PathVariable String reviewId, @AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody ReviewFirepowerRequest request) {
        return service.rate(reviewId, jwt.getSubject(), request.score());
    }

    @DeleteMapping
    public ReviewCommunityRatingResponse remove(@PathVariable String reviewId, @AuthenticationPrincipal Jwt jwt) {
        return service.remove(reviewId, jwt.getSubject());
    }
}
