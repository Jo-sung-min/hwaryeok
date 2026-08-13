package com.hwaryeok.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, String> {

    @Query("""
            SELECT product
            FROM Product product
            WHERE (:query = ''
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
}
