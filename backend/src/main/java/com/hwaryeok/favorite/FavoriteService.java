package com.hwaryeok.favorite;

import java.time.Instant;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductService;
import com.hwaryeok.user.ActiveUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FavoriteService {

    private final UserFavoriteRepository favoriteRepository;
    private final ActiveUserService activeUserService;
    private final ProductService productService;

    public FavoriteService(
            UserFavoriteRepository favoriteRepository,
            ActiveUserService activeUserService,
            ProductService productService
    ) {
        this.favoriteRepository = favoriteRepository;
        this.activeUserService = activeUserService;
        this.productService = productService;
    }

    @Transactional(readOnly = true)
    public FavoriteListResponse findAll(String userId) {
        activeUserService.requireActive(userId);
        return FavoriteListResponse.from(favoriteRepository.findByIdUserIdOrderByCreatedAtDesc(userId));
    }

    @Transactional
    public FavoriteItemResponse add(String userId, String productId) {
        activeUserService.requireActiveForUpdate(userId);
        Product product = productService.getProduct(productId);
        UserFavoriteId id = new UserFavoriteId(userId, productId);
        UserFavorite favorite = favoriteRepository.findById(id)
                .orElseGet(() -> favoriteRepository.saveAndFlush(new UserFavorite(userId, product, Instant.now())));
        return FavoriteItemResponse.from(favorite);
    }

    @Transactional
    public void remove(String userId, String productId) {
        activeUserService.requireActiveForUpdate(userId);
        favoriteRepository.deleteById(new UserFavoriteId(userId, productId));
    }
}
