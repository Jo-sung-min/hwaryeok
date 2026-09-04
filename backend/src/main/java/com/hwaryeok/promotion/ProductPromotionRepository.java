package com.hwaryeok.promotion;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ProductPromotionRepository extends JpaRepository<ProductPromotion, String> {

    boolean existsByProductId(String productId);

    @EntityGraph(attributePaths = "product")
    Optional<ProductPromotion> findById(String id);

    @EntityGraph(attributePaths = "product")
    List<ProductPromotion> findAllByOrderByUpdatedAtDesc();

    @EntityGraph(attributePaths = "product")
    @Query("""
            select promotion
            from ProductPromotion promotion
            where promotion.status = com.hwaryeok.promotion.PromotionStatus.ACTIVE
              and promotion.product.publicationStatus = com.hwaryeok.product.ProductPublicationStatus.PUBLISHED
              and (promotion.startsOn is null or promotion.startsOn <= :today)
              and (promotion.endsOn is null or promotion.endsOn >= :today)
            order by promotion.emergingBrand desc,
                     promotion.recommendationScore desc,
                     promotion.updatedAt desc
            """)
    List<ProductPromotion> findVisible(@Param("today") LocalDate today, Pageable pageable);
}
