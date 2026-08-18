package com.hwaryeok.product;

import org.springframework.http.MediaType;
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

    public AdminProductController(ProductImageService productImageService) {
        this.productImageService = productImageService;
    }

    @PutMapping(path = "/{productId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductResponse uploadImage(
            @PathVariable String productId,
            @RequestPart("file") MultipartFile file
    ) {
        return productImageService.upload(productId, file);
    }
}
