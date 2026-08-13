package com.hwaryeok.favorite;

import java.time.Instant;

import com.hwaryeok.auth.InvalidCredentialsException;
import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductService;
import com.hwaryeok.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FavoriteService {

    private final UserFavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    public FavoriteService(
            UserFavoriteRepository favoriteRepository,
            UserRepository userRepository,
            ProductService productService
    ) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.productService = productService;
    }

    @Transactional(readOnly = true)
    public FavoriteListResponse findAll(String userId) {
        requireActiveUser(userId);
        return FavoriteListResponse.from(favoriteRepository.findByIdUserIdOrderByCreatedAtDesc(userId));
    }

    @Transactional
    public FavoriteItemResponse add(String userId, String productId) {
        requireActiveUser(userId);
        Product product = productService.getProduct(productId);
        UserFavoriteId id = new UserFavoriteId(userId, productId);
        UserFavorite favorite = favoriteRepository.findById(id)
                .orElseGet(() -> favoriteRepository.saveAndFlush(new UserFavorite(userId, product, Instant.now())));
        return FavoriteItemResponse.from(favorite);
    }

    @Transactional
    public void remove(String userId, String productId) {
        requireActiveUser(userId);
        favoriteRepository.deleteById(new UserFavoriteId(userId, productId));
    }

    private void requireActiveUser(String userId) {
        boolean activeUser = userRepository.findById(userId)
                .filter(user -> "ACTIVE".equals(user.getStatus()))
                .isPresent();
        if (!activeUser) throw new InvalidCredentialsException();
    }
}
