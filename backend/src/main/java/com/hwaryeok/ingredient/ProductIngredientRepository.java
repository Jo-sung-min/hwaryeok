package com.hwaryeok.ingredient;

import java.util.List;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductIngredientRepository extends JpaRepository<ProductIngredient, ProductIngredientId> {

    @Query("""
            select relation
            from ProductIngredient relation
            join fetch relation.ingredient ingredient
            where relation.product.id = :productId
            order by relation.displayOrder
            """)
    List<ProductIngredient> findByProductId(@Param("productId") String productId);

    @Query("""
            select relation
            from ProductIngredient relation
            join fetch relation.ingredient ingredient
            where relation.product.id in :productIds
            order by relation.product.id, relation.displayOrder
            """)
    List<ProductIngredient> findByProductIds(@Param("productIds") Set<String> productIds);

    @Query("""
            select relation
            from ProductIngredient relation
            join fetch relation.product product
            where relation.ingredient.id = :ingredientId
            order by product.baseScore desc
            """)
    List<ProductIngredient> findByIngredientId(@Param("ingredientId") String ingredientId);

    long countByProductId(String productId);

    @Query("""
            select relation.product.id as productId, count(relation) as ingredientCount
            from ProductIngredient relation
            where relation.product.id in :productIds
            group by relation.product.id
            """)
    List<ProductIngredientCount> countByProductIds(@Param("productIds") Set<String> productIds);

    interface ProductIngredientCount {
        String getProductId();
        long getIngredientCount();
    }
}
