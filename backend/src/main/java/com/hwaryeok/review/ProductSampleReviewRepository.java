package com.hwaryeok.review;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface ProductSampleReviewRepository extends JpaRepository<ProductSampleReview, String> {
    boolean existsByProductId(String productId);
    Optional<ProductSampleReview> findByProductId(String productId);
}
