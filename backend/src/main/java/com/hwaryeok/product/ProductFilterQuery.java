package com.hwaryeok.product;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Reads cross-domain filter facts without making ProductService depend on ReviewService.
 */
@Component
public class ProductFilterQuery {

    private final JdbcTemplate jdbc;

    public ProductFilterQuery(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Set<String> findProductIdsContainingIngredient(String ingredientId) {
        return new LinkedHashSet<>(jdbc.queryForList("""
                SELECT relation.product_id
                FROM product_ingredients relation
                WHERE relation.ingredient_id = ?
                """, String.class, ingredientId));
    }

    public Map<String, BigDecimal> findActiveReviewAverageScores(Set<String> candidateProductIds) {
        if (candidateProductIds.isEmpty()) return Map.of();

        Map<String, BigDecimal> averages = new LinkedHashMap<>();
        jdbc.query("""
                SELECT review.product_id, AVG(review.total_score) AS average_score
                FROM reviews review
                JOIN users author ON author.id = review.user_id
                JOIN products product ON product.id = review.product_id
                WHERE author.status = 'ACTIVE'
                  AND product.publication_status = 'PUBLISHED'
                GROUP BY review.product_id
                """, resultSet -> {
            String productId = resultSet.getString("product_id");
            if (candidateProductIds.contains(productId)) {
                averages.put(productId, resultSet.getBigDecimal("average_score"));
            }
        });
        return averages;
    }
}
