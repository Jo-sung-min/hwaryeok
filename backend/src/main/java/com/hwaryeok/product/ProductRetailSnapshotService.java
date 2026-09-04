package com.hwaryeok.product;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductRetailSnapshotService {

    private final ProductService productService;
    private final ProductRetailSnapshotRepository snapshotRepository;

    public ProductRetailSnapshotService(
            ProductService productService,
            ProductRetailSnapshotRepository snapshotRepository
    ) {
        this.productService = productService;
        this.snapshotRepository = snapshotRepository;
    }

    public ProductRetailSnapshotResponse findSnapshot(String productId) {
        productService.getProduct(productId);
        return snapshotRepository.findById(productId)
                .map(ProductRetailSnapshotResponse::from)
                .orElseGet(() -> ProductRetailSnapshotResponse.unmatched(productId));
    }
}
