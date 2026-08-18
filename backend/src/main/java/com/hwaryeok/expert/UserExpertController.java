package com.hwaryeok.expert;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserExpertController {

    private final ExpertService expertService;

    public UserExpertController(ExpertService expertService) {
        this.expertService = expertService;
    }

    @GetMapping("/api/v1/experts/me/application")
    public ExpertApplicationResponse myApplication(@AuthenticationPrincipal Jwt jwt) {
        return expertService.findMyApplication(jwt.getSubject());
    }

    @PostMapping("/api/v1/experts/me/application")
    public ExpertApplicationResponse apply(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ExpertApplicationRequest request
    ) {
        return expertService.apply(jwt.getSubject(), request);
    }

    @PostMapping("/api/v1/users/me/questions")
    public ExpertQuestionDetailResponse ask(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ExpertQuestionRequest request
    ) {
        return expertService.createQuestion(jwt.getSubject(), request);
    }

    @PutMapping("/api/v1/users/me/expert-answers/{answerId}/helpful")
    public ExpertEngagementResponse helpful(@AuthenticationPrincipal Jwt jwt, @PathVariable String answerId) {
        return expertService.setHelpful(jwt.getSubject(), answerId, true);
    }

    @DeleteMapping("/api/v1/users/me/expert-answers/{answerId}/helpful")
    public ExpertEngagementResponse removeHelpful(@AuthenticationPrincipal Jwt jwt, @PathVariable String answerId) {
        return expertService.setHelpful(jwt.getSubject(), answerId, false);
    }

    @PutMapping("/api/v1/users/me/expert-answers/{answerId}/save")
    public ExpertEngagementResponse save(@AuthenticationPrincipal Jwt jwt, @PathVariable String answerId) {
        return expertService.setSaved(jwt.getSubject(), answerId, true);
    }

    @DeleteMapping("/api/v1/users/me/expert-answers/{answerId}/save")
    public ExpertEngagementResponse removeSave(@AuthenticationPrincipal Jwt jwt, @PathVariable String answerId) {
        return expertService.setSaved(jwt.getSubject(), answerId, false);
    }

    @PutMapping("/api/v1/users/me/questions/{questionId}/adopt/{answerId}")
    public ExpertEngagementResponse adopt(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String questionId,
            @PathVariable String answerId
    ) {
        return expertService.adopt(jwt.getSubject(), questionId, answerId);
    }

    @PostMapping("/api/v1/expert/questions/{questionId}/answers")
    public ExpertAnswerResponse answer(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String questionId,
            @Valid @RequestBody ExpertAnswerRequest request
    ) {
        return expertService.createAnswer(jwt.getSubject(), questionId, request);
    }
}
