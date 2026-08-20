package com.hwaryeok.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, String> {

    Optional<Product> findByIdAndPublicationStatus(String id, ProductPublicationStatus publicationStatus);

    List<Product> findAllByPublicationStatus(ProductPublicationStatus publicationStatus, Sort sort);

    @Query("""
            SELECT product
            FROM Product product
            WHERE product.publicationStatus = com.hwaryeok.product.ProductPublicationStatus.PUBLISHED
              AND (:query = ''
                OR LOWER(product.name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(product.brand) LIKE LOWER(CONCAT('%', :query, '%')))
              AND (:category = '' OR product.category = :category)
              AND (:minimumScore IS NULL OR product.baseScore >= :minimumScore)
              AND (:maximumScore IS NULL OR product.baseScore <= :maximumScore)
            """)
    Page<Product> search(
            @Param("query") String query,
            @Param("category") String category,
            @Param("minimumScore") Integer minimumScore,
            @Param("maximumScore") Integer maximumScore,
            Pageable pageable
    );

    @Query("""
            select product
            from Product product
            where product.id <> :productId
              and product.publicationStatus = com.hwaryeok.product.ProductPublicationStatus.PUBLISHED
            order by case when product.category = :category then 0 else 1 end,
                     abs(product.baseScore - :baseScore),
                     product.id
            """)
    List<Product> findRelated(
            @Param("productId") String productId,
            @Param("category") String category,
            @Param("baseScore") int baseScore,
            Pageable pageable
    );
}
