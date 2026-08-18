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
@RequestMapping("/api/v1/questions")
public class ExpertQuestionController {

    private final ExpertService expertService;

    public ExpertQuestionController(ExpertService expertService) {
        this.expertService = expertService;
    }

    @GetMapping
    public List<ExpertQuestionListItemResponse> findAll(@RequestParam(required = false) String status) {
        return expertService.findQuestions(status);
    }

    @GetMapping("/{questionId}")
    public ExpertQuestionDetailResponse findOne(
            @PathVariable String questionId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return expertService.findQuestion(questionId, jwt == null ? null : jwt.getSubject());
    }
}
