package com.hwaryeok.datasource;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
public class ProductRegulatorySourceController {

    private final MfdsProductMatchService mfdsProductMatchService;

    public ProductRegulatorySourceController(MfdsProductMatchService mfdsProductMatchService) {
        this.mfdsProductMatchService = mfdsProductMatchService;
    }

    @GetMapping("/{productId}/regulatory-source")
    ProductRegulatorySourceResponse findRegulatorySource(@PathVariable String productId) {
        return mfdsProductMatchService.findPublicSource(productId);
    }
}
