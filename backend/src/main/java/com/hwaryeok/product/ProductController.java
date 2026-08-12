package com.hwaryeok.product;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
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

    @GetMapping("/ranking")
    public List<ProductResponse> findRanking(
            @RequestParam(defaultValue = "수부지") String skinType,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return productService.findRanking(skinType, limit);
    }
}
