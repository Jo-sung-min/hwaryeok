package com.hwaryeok.ingredient;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IngredientRepository extends JpaRepository<Ingredient, String> {

    @Query(value = """
            select distinct ingredient
            from Ingredient ingredient
            left join ingredient.tags tag
            where (:query = ''
                   or lower(ingredient.name) like lower(concat('%', :query, '%'))
                   or lower(ingredient.englishName) like lower(concat('%', :query, '%')))
              and (:status is null or ingredient.status = :status)
              and (:tag = '' or tag = :tag)
            """, countQuery = """
            select count(distinct ingredient)
            from Ingredient ingredient
            left join ingredient.tags tag
            where (:query = ''
                   or lower(ingredient.name) like lower(concat('%', :query, '%'))
                   or lower(ingredient.englishName) like lower(concat('%', :query, '%')))
              and (:status is null or ingredient.status = :status)
              and (:tag = '' or tag = :tag)
            """)
    Page<Ingredient> search(
            @Param("query") String query,
            @Param("status") IngredientStatus status,
            @Param("tag") String tag,
            Pageable pageable
    );
}
