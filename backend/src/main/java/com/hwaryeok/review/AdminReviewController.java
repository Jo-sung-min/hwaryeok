package com.hwaryeok.review;

import com.hwaryeok.review.AdminReviewDtos.PageResponse;
import com.hwaryeok.user.ActiveUserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/reviews")
public class AdminReviewController {

    private final AdminReviewService reviewService;
    private final ActiveUserService activeUserService;

    public AdminReviewController(AdminReviewService reviewService, ActiveUserService activeUserService) {
        this.reviewService = reviewService;
        this.activeUserService = activeUserService;
    }

    @GetMapping
    public PageResponse find(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "ALL") String kind,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return reviewService.find(q, kind, page, size);
    }

    @DeleteMapping("/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable String reviewId) {
        activeUserService.requireAdmin(jwt.getSubject());
        reviewService.delete(reviewId);
    }
}
