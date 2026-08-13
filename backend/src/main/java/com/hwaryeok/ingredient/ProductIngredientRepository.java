package com.hwaryeok.ingredient;

import java.util.List;

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
            join fetch relation.product product
            where relation.ingredient.id = :ingredientId
            order by product.baseScore desc
            """)
    List<ProductIngredient> findByIngredientId(@Param("ingredientId") String ingredientId);
}
