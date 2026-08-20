package com.hwaryeok.comparison;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductPublicationStatus;
import com.hwaryeok.product.ProductService;
import com.hwaryeok.user.ActiveUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ComparisonProductService {

    private final UserComparisonProductRepository comparisonProductRepository;
    private final ActiveUserService activeUserService;
    private final ProductService productService;

    public ComparisonProductService(
            UserComparisonProductRepository comparisonProductRepository,
            ActiveUserService activeUserService,
            ProductService productService
    ) {
        this.comparisonProductRepository = comparisonProductRepository;
        this.activeUserService = activeUserService;
        this.productService = productService;
    }

    @Transactional(readOnly = true)
    public ComparisonProductListResponse findAll(String userId) {
        activeUserService.requireActive(userId);
        return ComparisonProductListResponse.from(
                comparisonProductRepository
                        .findByIdUserIdAndProductPublicationStatusOrderByDisplayOrderAsc(
                                userId,
                                ProductPublicationStatus.PUBLISHED
                        )
        );
    }

    @Transactional
    public ComparisonProductListResponse save(String userId, ComparisonProductsRequest request) {
        activeUserService.requireActiveForUpdate(userId);
        List<String> productIds = request.productIds();
        if (new LinkedHashSet<>(productIds).size() != productIds.size()) {
            throw new IllegalArgumentException("같은 제품을 중복해서 비교할 수 없어요.");
        }

        List<Product> products = productIds.stream()
                .map(productService::getProduct)
                .toList();

        comparisonProductRepository.deleteByIdUserId(userId);
        comparisonProductRepository.flush();

        Instant savedAt = Instant.now();
        List<UserComparisonProduct> comparisonProducts = new ArrayList<>();
        for (int index = 0; index < products.size(); index++) {
            comparisonProducts.add(new UserComparisonProduct(userId, products.get(index), index + 1, savedAt));
        }
        return ComparisonProductListResponse.from(comparisonProductRepository.saveAllAndFlush(comparisonProducts));
    }

    @Transactional
    public void clear(String userId) {
        activeUserService.requireActiveForUpdate(userId);
        comparisonProductRepository.deleteByIdUserId(userId);
    }
}
