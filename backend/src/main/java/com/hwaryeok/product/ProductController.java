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
    public List<ProductResponse> findProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer grade
    ) {
        return productService.findProducts(query, category, grade);
    }

    @GetMapping("/{id}")
    public ProductResponse findProduct(@PathVariable String id) {
        return productService.findProduct(id);
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
            @RequestParam(defaultValue = "10") int limit
    ) {
        return productService.findRanking(skinType, limit);
    }
}
