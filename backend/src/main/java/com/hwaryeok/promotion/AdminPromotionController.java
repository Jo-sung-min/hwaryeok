package com.hwaryeok.promotion;

import java.util.List;

import com.hwaryeok.user.ActiveUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/promotions")
public class AdminPromotionController {

    private final PromotionService promotionService;
    private final ActiveUserService activeUserService;

    public AdminPromotionController(PromotionService promotionService, ActiveUserService activeUserService) {
        this.promotionService = promotionService;
        this.activeUserService = activeUserService;
    }

    @GetMapping
    public List<PromotionResponse> findAll(@AuthenticationPrincipal Jwt jwt) {
        activeUserService.requireAdmin(jwt.getSubject());
        return promotionService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PromotionResponse create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody PromotionRequest request
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return promotionService.create(request);
    }

    @PutMapping("/{promotionId}")
    public PromotionResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String promotionId,
            @Valid @RequestBody PromotionRequest request
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return promotionService.update(promotionId, request);
    }

    @DeleteMapping("/{promotionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable String promotionId) {
        activeUserService.requireAdmin(jwt.getSubject());
        promotionService.delete(promotionId);
    }
}
