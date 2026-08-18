package com.hwaryeok.product;

import java.time.Duration;

import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/media/products")
public class ProductMediaController {

    private final ProductImageService productImageService;

    public ProductMediaController(ProductImageService productImageService) {
        this.productImageService = productImageService;
    }

    @GetMapping("/{productId}")
    public ResponseEntity<byte[]> get(@PathVariable String productId) {
        ProductImagePayload image = productImageService.get(productId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(image.originalName())
                        .build()
                        .toString())
                .body(image.data());
    }
}
