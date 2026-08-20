package com.hwaryeok.comparison;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/comparison-products")
public class ComparisonProductController {

    private final ComparisonProductService comparisonProductService;

    public ComparisonProductController(ComparisonProductService comparisonProductService) {
        this.comparisonProductService = comparisonProductService;
    }

    @GetMapping
    public ComparisonProductListResponse findAll(@AuthenticationPrincipal Jwt jwt) {
        return comparisonProductService.findAll(jwt.getSubject());
    }

    @PutMapping
    public ComparisonProductListResponse save(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ComparisonProductsRequest request
    ) {
        return comparisonProductService.save(jwt.getSubject(), request);
    }

    @DeleteMapping
    public ResponseEntity<Void> clear(@AuthenticationPrincipal Jwt jwt) {
        comparisonProductService.clear(jwt.getSubject());
        return ResponseEntity.noContent().build();
    }
}
