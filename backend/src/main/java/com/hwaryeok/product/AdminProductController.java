package com.hwaryeok.product;

import com.hwaryeok.user.ActiveUserService;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {

    private final ProductImageService productImageService;
    private final ActiveUserService activeUserService;

    public AdminProductController(ProductImageService productImageService, ActiveUserService activeUserService) {
        this.productImageService = productImageService;
        this.activeUserService = activeUserService;
    }

    @PutMapping(path = "/{productId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductResponse uploadImage(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId,
            @RequestPart("file") MultipartFile file
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return productImageService.upload(productId, file);
    }
}
