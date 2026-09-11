package com.hwaryeok.product;

import java.util.List;
import java.util.stream.Stream;

import com.hwaryeok.ingredient.IngredientService;
import com.hwaryeok.ingredient.ProductIngredientsResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;
    private final IngredientService ingredientService;
    private final ProductRetailSnapshotService productRetailSnapshotService;

    public ProductController(
            ProductService productService,
            IngredientService ingredientService,
            ProductRetailSnapshotService productRetailSnapshotService
    ) {
        this.productService = productService;
        this.ingredientService = ingredientService;
        this.productRetailSnapshotService = productRetailSnapshotService;
    }

    @GetMapping
    public ProductPageResponse findProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer grade,
            @RequestParam(required = false) String concern,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) String confidence,
            @RequestParam(required = false) String ingredientId,
            @RequestParam(required = false) Integer minReviewScore,
            @RequestParam(required = false) Integer minFirepowerScore,
            @RequestParam(required = false) String skinType,
            @RequestParam(required = false) String hydrationLevel,
            @RequestParam(required = false) String oilinessLevel,
            @RequestParam(required = false) String sensitivityLevel,
            @RequestParam(required = false) String breakoutFrequency,
            @RequestParam(required = false) String cleansingTightness,
            @RequestParam(required = false) String rednessFrequency,
            @RequestParam(required = false) String poreLevel,
            @RequestParam(required = false) String texturePreference,
            @RequestParam(required = false) String routineComplexity,
            @RequestParam(required = false) String sunscreenUsage,
            @RequestParam(required = false) List<String> concerns,
            @RequestParam(required = false) List<String> reactionTriggers,
            @RequestParam(required = false) List<String> breakoutZones,
            @RequestParam(required = false) List<String> environments,
            @RequestParam(required = false) List<String> routineContexts,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "score") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        ProductConcernSearch.Resolution concernSearch = ProductConcernSearch.resolve(query);
        String resolvedQuery = concernSearch == null ? query : concernSearch.remainingQuery();
        String inferredCategory = ProductConcernSearch.resolveCategory(resolvedQuery);
        String resolvedCategory = category == null || category.isBlank() ? inferredCategory : category;
        if (inferredCategory != null && (category == null || category.isBlank())) resolvedQuery = null;
        String resolvedConcern = concern == null || concern.isBlank()
                ? concernSearch == null ? null : concernSearch.concern()
                : concern;
        ProductMatchProfile profile = profile(
                skinType, hydrationLevel, oilinessLevel, sensitivityLevel, breakoutFrequency, cleansingTightness,
                rednessFrequency, poreLevel, texturePreference, routineComplexity, sunscreenUsage,
                mergeConcern(concerns, resolvedConcern), reactionTriggers, breakoutZones, environments, routineContexts
        );
        return productService.findProducts(
                resolvedQuery, resolvedCategory, grade, resolvedConcern, maxPrice, confidence,
                ingredientId, minReviewScore, minFirepowerScore,
                page, size, sort, direction, profile
        );
    }

    @GetMapping("/{id}")
    public ProductResponse findProduct(@PathVariable String id) {
        return productService.findProduct(id);
    }

    @GetMapping("/{id}/retail-snapshot")
    public ProductRetailSnapshotResponse findRetailSnapshot(@PathVariable String id) {
        return productRetailSnapshotService.findSnapshot(id);
    }

    @GetMapping("/{id}/related")
    public List<ProductResponse> findRelatedProducts(
            @PathVariable String id,
            @RequestParam(defaultValue = "3") int limit
    ) {
        return productService.findRelatedProducts(id, limit);
    }

    @GetMapping("/{id}/ingredients")
    public ProductIngredientsResponse findProductIngredients(
            @PathVariable String id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String tag
    ) {
        return ingredientService.findProductIngredients(id, status, tag);
    }

    @GetMapping("/ranking")
    public List<ProductResponse> findRanking(
            @RequestParam(defaultValue = "수부지") String skinType,
            @RequestParam(required = false) String hydrationLevel,
            @RequestParam(required = false) String oilinessLevel,
            @RequestParam(required = false) String sensitivityLevel,
            @RequestParam(required = false) String breakoutFrequency,
            @RequestParam(required = false) String cleansingTightness,
            @RequestParam(required = false) String rednessFrequency,
            @RequestParam(required = false) String poreLevel,
            @RequestParam(required = false) String texturePreference,
            @RequestParam(required = false) String routineComplexity,
            @RequestParam(required = false) String sunscreenUsage,
            @RequestParam(required = false) List<String> concerns,
            @RequestParam(required = false) List<String> reactionTriggers,
            @RequestParam(required = false) List<String> breakoutZones,
            @RequestParam(required = false) List<String> environments,
            @RequestParam(required = false) List<String> routineContexts,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return productService.findRanking(profile(
                skinType, hydrationLevel, oilinessLevel, sensitivityLevel, breakoutFrequency, cleansingTightness,
                rednessFrequency, poreLevel, texturePreference, routineComplexity, sunscreenUsage,
                concerns, reactionTriggers, breakoutZones, environments, routineContexts
        ), category, limit);
    }

    private ProductMatchProfile profile(
            String skinType,
            String hydrationLevel,
            String oilinessLevel,
            String sensitivityLevel,
            String breakoutFrequency,
            String cleansingTightness,
            String rednessFrequency,
            String poreLevel,
            String texturePreference,
            String routineComplexity,
            String sunscreenUsage,
            List<String> concerns,
            List<String> reactionTriggers,
            List<String> breakoutZones,
            List<String> environments,
            List<String> routineContexts
    ) {
        return new ProductMatchProfile(
                skinType, hydrationLevel, oilinessLevel, sensitivityLevel, breakoutFrequency, cleansingTightness,
                rednessFrequency, poreLevel, texturePreference, routineComplexity, sunscreenUsage,
                concerns, reactionTriggers, breakoutZones, environments, routineContexts
        );
    }

    private List<String> mergeConcern(List<String> concerns, String concern) {
        if (concern == null || concern.isBlank()) return concerns == null ? List.of() : concerns;
        return Stream.concat((concerns == null ? List.<String>of() : concerns).stream(), Stream.of(concern))
                .distinct()
                .toList();
    }
}
