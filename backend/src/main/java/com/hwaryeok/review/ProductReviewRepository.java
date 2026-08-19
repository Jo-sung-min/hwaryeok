package com.hwaryeok.review;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

interface ProductReviewRepository extends JpaRepository<ProductReview, String> {

    boolean existsByProductIdAndUserId(String productId, String userId);

    @EntityGraph(attributePaths = {"user", "template", "scores", "scores.criterion"})
    List<ProductReview> findByProductIdOrderByCreatedAtDesc(String productId);
}
