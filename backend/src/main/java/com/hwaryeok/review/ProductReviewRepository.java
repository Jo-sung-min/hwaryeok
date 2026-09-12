package com.hwaryeok.review;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

interface ProductReviewRepository extends JpaRepository<ProductReview, String> {

    boolean existsByProductIdAndUserId(String productId, String userId);

    @EntityGraph(attributePaths = {"user", "template", "scores", "scores.criterion"})
    Optional<ProductReview> findByProductIdAndUserId(String productId, String userId);

    @Query("""
            select count(review) from ProductReview review where review.product.id = :productId
            and review.user.status = 'ACTIVE'
            and review.product.publicationStatus = com.hwaryeok.product.ProductPublicationStatus.PUBLISHED
            """)
    long countByProductId(@Param("productId") String productId);

    @Query("""
            select avg(review.totalScore) from ProductReview review where review.product.id = :productId
            and review.user.status = 'ACTIVE'
            and review.product.publicationStatus = com.hwaryeok.product.ProductPublicationStatus.PUBLISHED
            """)
    Double averageTotalScoreByProductId(@Param("productId") String productId);

    @Query("""
            select avg(review.totalScore) from ProductReview review where review.user.id = :userId
            and review.user.status = 'ACTIVE'
            and review.product.publicationStatus = com.hwaryeok.product.ProductPublicationStatus.PUBLISHED
            """)
    Double averageTotalScoreByUserId(@Param("userId") String userId);

    @EntityGraph(attributePaths = "user")
    @Query("""
            select review from ProductReview review where review.product.id = :productId
            and review.user.status = 'ACTIVE'
            and review.product.publicationStatus = com.hwaryeok.product.ProductPublicationStatus.PUBLISHED
            order by review.createdAt desc, review.id asc
            """)
    List<ProductReview> findPublicByProductId(@Param("productId") String productId, Pageable pageable);

    @EntityGraph(attributePaths = {"product", "user"})
    @Query("""
            select review from ProductReview review where review.user.id = :userId
            and review.user.status = 'ACTIVE'
            and review.product.publicationStatus = com.hwaryeok.product.ProductPublicationStatus.PUBLISHED
            order by review.createdAt desc, review.id asc
            """)
    Page<ProductReview> findByUserIdOrderByCreatedAtDesc(@Param("userId") String userId, Pageable pageable);
}
