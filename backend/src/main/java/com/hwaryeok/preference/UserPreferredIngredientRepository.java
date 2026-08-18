package com.hwaryeok.preference;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserPreferredIngredientRepository extends JpaRepository<UserPreferredIngredient, UserPreferredIngredientId> {

    @Query("""
            select preference
            from UserPreferredIngredient preference
            join fetch preference.ingredient ingredient
            where preference.id.userId = :userId
            order by preference.priority
            """)
    List<UserPreferredIngredient> findByUserId(@Param("userId") String userId);

    @Modifying
    @Query("delete from UserPreferredIngredient preference where preference.id.userId = :userId")
    void deleteAllByUserId(@Param("userId") String userId);
}
