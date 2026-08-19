package com.hwaryeok.product;

import java.util.List;

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

    public ProductController(ProductService productService, IngredientService ingredientService) {
        this.productService = productService;
        this.ingredientService = ingredientService;
    }

    @GetMapping
    public ProductPageResponse findProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer grade,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "score") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        return productService.findProducts(query, category, grade, page, size, sort, direction);
    }

    @GetMapping("/{id}")
    public ProductResponse findProduct(@PathVariable String id) {
        return productService.findProduct(id);
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
            @RequestParam(required = false) String texturePreference,
            @RequestParam(required = false) List<String> concerns,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return productService.findRanking(skinType, hydrationLevel, oilinessLevel, sensitivityLevel, texturePreference, concerns, limit);
    }
}
