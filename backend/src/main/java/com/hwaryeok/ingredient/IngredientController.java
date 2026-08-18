package com.hwaryeok.ingredient;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ingredients")
public class IngredientController {

    private final IngredientService ingredientService;
    private final IngredientFirepowerService ingredientFirepowerService;

    public IngredientController(IngredientService ingredientService,
                                IngredientFirepowerService ingredientFirepowerService) {
        this.ingredientService = ingredientService;
        this.ingredientFirepowerService = ingredientFirepowerService;
    }

    @GetMapping("/featured")
    public List<IngredientResponse> findFeaturedIngredients(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ingredientService.findFeaturedIngredients(limit);
    }

    @GetMapping("/{id}/firepower")
    public IngredientFirepowerResponse findIngredientFirepower(
            @PathVariable String id,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ingredientFirepowerService.rankProducts(id, limit);
    }

    @GetMapping
    public IngredientPageResponse findIngredients(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        return ingredientService.findIngredients(query, status, tag, page, size, sort, direction);
    }

    @GetMapping("/{id}")
    public IngredientDetailResponse findIngredient(@PathVariable String id) {
        return ingredientService.findIngredient(id);
    }
}
