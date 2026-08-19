package com.hwaryeok.review;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ProductReviewScoreRepository extends JpaRepository<ProductReviewScore, String> {

    @Query("""
            select score.criterion.id as criterionId,
                   avg(score.score) as averageScore,
                   count(score) as reviewCount
            from ProductReviewScore score
            where score.review.product.id = :productId
            group by score.criterion.id
            """)
    List<CriterionScoreAggregate> aggregateByProductId(@Param("productId") String productId);

    interface CriterionScoreAggregate {
        String getCriterionId();
        Double getAverageScore();
        long getReviewCount();
    }
}
