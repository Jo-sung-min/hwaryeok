package com.hwaryeok.favorite;

import java.util.List;

public record FavoriteListResponse(
        List<FavoriteItemResponse> content,
        int totalElements
) {
    public static FavoriteListResponse from(List<UserFavorite> favorites) {
        List<FavoriteItemResponse> content = favorites.stream()
                .map(FavoriteItemResponse::from)
                .toList();
        return new FavoriteListResponse(content, content.size());
    }
}
