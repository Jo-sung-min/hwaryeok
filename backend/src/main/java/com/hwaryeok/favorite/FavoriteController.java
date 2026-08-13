package com.hwaryeok.favorite;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public FavoriteListResponse findAll(@AuthenticationPrincipal Jwt jwt) {
        return favoriteService.findAll(jwt.getSubject());
    }

    @PutMapping("/{productId}")
    public FavoriteItemResponse add(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId
    ) {
        return favoriteService.add(jwt.getSubject(), productId);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> remove(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId
    ) {
        favoriteService.remove(jwt.getSubject(), productId);
        return ResponseEntity.noContent().build();
    }
}
