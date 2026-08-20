package com.hwaryeok.favorite;

import java.time.Instant;

import com.hwaryeok.product.ProductResponse;

public record FavoriteItemResponse(
        ProductResponse product,
        Instant favoritedAt
) {
    public static FavoriteItemResponse from(UserFavorite favorite) {
        return new FavoriteItemResponse(
                ProductResponse.from(favorite.getProduct()),
                favorite.getCreatedAt()
        );
    }

    public static FavoriteItemResponse from(UserFavorite favorite, ProductResponse product) {
        return new FavoriteItemResponse(product, favorite.getCreatedAt());
    }
}
