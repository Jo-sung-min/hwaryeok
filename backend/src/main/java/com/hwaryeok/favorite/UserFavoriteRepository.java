package com.hwaryeok.favorite;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserFavoriteRepository extends JpaRepository<UserFavorite, UserFavoriteId> {

    @EntityGraph(attributePaths = "product")
    List<UserFavorite> findByIdUserIdOrderByCreatedAtDesc(String userId);
}
