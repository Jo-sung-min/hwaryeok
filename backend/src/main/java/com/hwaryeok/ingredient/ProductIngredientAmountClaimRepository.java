package com.hwaryeok.ingredient;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductIngredientAmountClaimRepository
        extends JpaRepository<ProductIngredientAmountClaim, ProductIngredientId> {

    @Query("""
            select claim from ProductIngredientAmountClaim claim
            where claim.id.productId = :productId
            order by claim.id.ingredientId
            """)
    List<ProductIngredientAmountClaim> findByProductId(@Param("productId") String productId);

    @Query("""
            select claim from ProductIngredientAmountClaim claim
            where claim.id.productId = :productId
              and claim.verificationStatus = :status
            order by claim.id.ingredientId
            """)
    List<ProductIngredientAmountClaim> findByProductIdAndStatus(
            @Param("productId") String productId,
            @Param("status") IngredientAmountVerificationStatus status
    );

    @Query("""
            select claim from ProductIngredientAmountClaim claim
            where claim.id = :id and claim.verificationStatus = :status
            """)
    Optional<ProductIngredientAmountClaim> findByIdAndStatus(
            @Param("id") ProductIngredientId id,
            @Param("status") IngredientAmountVerificationStatus status
    );

    @Query("""
            select claim from ProductIngredientAmountClaim claim
            where claim.id.productId in :productIds
              and claim.verificationStatus = :status
            """)
    List<ProductIngredientAmountClaim> findByProductIdsAndStatus(
            @Param("productIds") Set<String> productIds,
            @Param("status") IngredientAmountVerificationStatus status
    );

    @Query("""
            select claim from ProductIngredientAmountClaim claim
            where claim.id.ingredientId = :ingredientId
              and claim.id.productId in :productIds
              and claim.verificationStatus = :status
            """)
    List<ProductIngredientAmountClaim> findByIngredientIdAndProductIdsAndStatus(
            @Param("ingredientId") String ingredientId,
            @Param("productIds") Set<String> productIds,
            @Param("status") IngredientAmountVerificationStatus status
    );
}
