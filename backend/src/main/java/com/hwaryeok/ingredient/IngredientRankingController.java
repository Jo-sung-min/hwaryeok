package com.hwaryeok.ingredient;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hwaryeok.ingredient.IngredientRankingDtos.OptionsResponse;
import com.hwaryeok.ingredient.IngredientRankingDtos.RankingResponse;

@RestController
@RequestMapping("/api/v1/ingredient-rankings")
public class IngredientRankingController {

    private final IngredientRankingService rankingService;

    public IngredientRankingController(IngredientRankingService rankingService) {
        this.rankingService = rankingService;
    }

    @GetMapping("/options")
    public OptionsResponse options() {
        return rankingService.options();
    }

    @GetMapping
    public RankingResponse rank(
            @RequestParam(required = false) String ingredientId,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "FIREPOWER") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return rankingService.rank(ingredientId, category, sort, page, size);
    }
}
