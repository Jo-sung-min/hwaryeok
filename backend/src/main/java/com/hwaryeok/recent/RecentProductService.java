package com.hwaryeok.recent;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductService;
import com.hwaryeok.product.ProductResponse;
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
        List<UserRecentProduct> recentProducts = recentProductRepository.findTop6ByIdUserIdOrderByViewedAtDesc(userId);
        Map<String, ProductResponse> products = productService.toNeutralResponses(
                recentProducts.stream().map(UserRecentProduct::getProduct).toList()
        );
        return new RecentProductListResponse(
                recentProducts.stream()
                        .map(item -> RecentProductItemResponse.from(item, products.get(item.getProduct().getId())))
                        .toList(),
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
        return RecentProductItemResponse.from(recentProduct, productService.toNeutralResponse(product));
    }

}
