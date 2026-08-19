package com.hwaryeok.review;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ProductReviewRepository extends JpaRepository<ProductReview, String> {

    boolean existsByProductIdAndUserId(String productId, String userId);

    long countByProductId(String productId);

    @Query("select avg(review.totalScore) from ProductReview review where review.product.id = :productId")
    Double averageTotalScoreByProductId(@Param("productId") String productId);

    @EntityGraph(attributePaths = "user")
    List<ProductReview> findTop5ByProductIdOrderByCreatedAtDesc(String productId);
}
