package com.hwaryeok.ingredient;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ingredients/recommendations")
public class IngredientRecommendationController {

    private final IngredientRecommendationService recommendationService;

    public IngredientRecommendationController(IngredientRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @PostMapping
    public List<IngredientRecommendationResponse> recommend(
            @Valid @RequestBody IngredientRecommendationRequest request
    ) {
        return recommendationService.recommend(request);
    }
}
