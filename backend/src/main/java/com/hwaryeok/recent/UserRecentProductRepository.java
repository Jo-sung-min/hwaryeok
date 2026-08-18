package com.hwaryeok.recent;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRecentProductRepository extends JpaRepository<UserRecentProduct, UserRecentProductId> {

    @EntityGraph(attributePaths = "product")
    List<UserRecentProduct> findTop6ByIdUserIdOrderByViewedAtDesc(String userId);

    long countByIdUserId(String userId);
}
