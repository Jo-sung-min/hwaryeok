package com.hwaryeok.recent;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/recent-products")
public class RecentProductController {

    private final RecentProductService recentProductService;

    public RecentProductController(RecentProductService recentProductService) {
        this.recentProductService = recentProductService;
    }

    @GetMapping
    public RecentProductListResponse findAll(@AuthenticationPrincipal Jwt jwt) {
        return recentProductService.findAll(jwt.getSubject());
    }

    @PutMapping("/{productId}")
    public RecentProductItemResponse record(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId
    ) {
        return recentProductService.record(jwt.getSubject(), productId);
    }
}
