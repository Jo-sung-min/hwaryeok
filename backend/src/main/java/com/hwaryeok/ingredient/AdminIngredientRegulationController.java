package com.hwaryeok.ingredient;

import java.util.List;

import com.hwaryeok.user.ActiveUserService;
import com.hwaryeok.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/data-sources")
public class AdminIngredientRegulationController {

    private final ActiveUserService activeUserService;
    private final IngredientRegulationService regulationService;

    public AdminIngredientRegulationController(
            ActiveUserService activeUserService,
            IngredientRegulationService regulationService
    ) {
        this.activeUserService = activeUserService;
        this.regulationService = regulationService;
    }

    @GetMapping("/mfds/ingredient-regulation-reviews")
    List<AdminIngredientRegulationReviewResponse> findReviews(@AuthenticationPrincipal Jwt jwt) {
        activeUserService.requireAdmin(jwt.getSubject());
        return regulationService.findAllVerifiedReviews();
    }

    @GetMapping("/ingredients/{ingredientId}/mfds-regulation-candidates")
    List<IngredientRegulationCandidateResponse> findCandidates(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String ingredientId,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "10") int limit
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return regulationService.findCandidates(ingredientId, query, limit);
    }

    @PutMapping("/ingredients/{ingredientId}/mfds-regulations/{sourceRecordId}")
    AdminIngredientRegulationReviewResponse verify(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String ingredientId,
            @PathVariable String sourceRecordId,
            @RequestBody IngredientRegulationReviewRequest request
    ) {
        User reviewer = activeUserService.requireAdmin(jwt.getSubject());
        return regulationService.verify(ingredientId, sourceRecordId, reviewer.getId(), request.reviewNote());
    }

    @DeleteMapping("/ingredients/{ingredientId}/mfds-regulations/{sourceRecordId}")
    void remove(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String ingredientId,
            @PathVariable String sourceRecordId
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        regulationService.remove(ingredientId, sourceRecordId);
    }
}
