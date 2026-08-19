package com.hwaryeok.recent;

import java.time.Instant;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductService;
import com.hwaryeok.user.ActiveUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecentProductService {

    private final UserRecentProductRepository recentProductRepository;
    private final ActiveUserService activeUserService;
    private final ProductService productService;

    public RecentProductService(
            UserRecentProductRepository recentProductRepository,
            ActiveUserService activeUserService,
            ProductService productService
    ) {
        this.recentProductRepository = recentProductRepository;
        this.activeUserService = activeUserService;
        this.productService = productService;
    }

    @Transactional(readOnly = true)
    public RecentProductListResponse findAll(String userId) {
        activeUserService.requireActive(userId);
        return RecentProductListResponse.from(
                recentProductRepository.findTop6ByIdUserIdOrderByViewedAtDesc(userId),
                recentProductRepository.countByIdUserId(userId)
        );
    }

    @Transactional
    public RecentProductItemResponse record(String userId, String productId) {
        activeUserService.requireActiveForUpdate(userId);
        Product product = productService.getProduct(productId);
        UserRecentProductId id = new UserRecentProductId(userId, productId);
        UserRecentProduct recentProduct = recentProductRepository.findById(id)
                .map(existing -> {
                    existing.markViewed(Instant.now());
                    return existing;
                })
                .orElseGet(() -> recentProductRepository.save(new UserRecentProduct(userId, product, Instant.now())));
        recentProductRepository.flush();
        return RecentProductItemResponse.from(recentProduct);
    }

}
