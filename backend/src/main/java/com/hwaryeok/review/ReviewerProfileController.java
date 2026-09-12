package com.hwaryeok.review;

import static com.hwaryeok.review.ReviewerProfileDtos.*;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
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

    @PostMapping("/image-upload-url")
    public ImageUploadUrlResponse createImageUploadUrl(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ImageUploadUrlRequest request,
            HttpServletResponse response
    ) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return reviewerProfileService.createImageUploadUrl(jwt.getSubject(), request);
    }

    @PostMapping("/image-upload-complete")
    public EditorResponse completeImageUpload(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ImageUploadCompleteRequest request
    ) {
        return reviewerProfileService.completeImageUpload(jwt.getSubject(), request);
    }

    @DeleteMapping("/image")
    public EditorResponse deleteImage(@AuthenticationPrincipal Jwt jwt) {
        return reviewerProfileService.deleteImage(jwt.getSubject());
    }

}
