package com.hwaryeok.review;

import static com.hwaryeok.review.ReviewerProfileDtos.*;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/reviewer-profile")
public class ReviewerProfileController {

    private final ReviewerProfileService reviewerProfileService;

    public ReviewerProfileController(ReviewerProfileService reviewerProfileService) {
        this.reviewerProfileService = reviewerProfileService;
    }

    @GetMapping
    public EditorResponse mine(@AuthenticationPrincipal Jwt jwt) {
        return reviewerProfileService.mine(jwt.getSubject());
    }

    @PutMapping
    public EditorResponse save(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateRequest request
    ) {
        return reviewerProfileService.save(jwt.getSubject(), request);
    }
}
