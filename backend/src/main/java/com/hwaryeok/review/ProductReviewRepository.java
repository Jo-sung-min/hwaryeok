package com.hwaryeok.review;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

interface ProductReviewRepository extends JpaRepository<ProductReview, String> {

    boolean existsByProductIdAndUserId(String productId, String userId);

    long countByProductId(String productId);

    @Query("select avg(review.totalScore) from ProductReview review where review.product.id = :productId")
    Double averageTotalScoreByProductId(@Param("productId") String productId);

    @Query("select avg(review.totalScore) from ProductReview review where review.user.id = :userId")
    Double averageTotalScoreByUserId(@Param("userId") String userId);

    @EntityGraph(attributePaths = "user")
    List<ProductReview> findTop5ByProductIdOrderByCreatedAtDesc(String productId);

    @EntityGraph(attributePaths = {"product", "user"})
    Page<ProductReview> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
}
