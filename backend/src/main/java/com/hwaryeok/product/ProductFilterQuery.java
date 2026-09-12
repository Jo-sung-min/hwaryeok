package com.hwaryeok.product;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Reads cross-domain filter and catalog facts without making ProductService depend on ReviewService.
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

    public Map<String, ReviewMetrics> findActiveReviewMetrics(Set<String> candidateProductIds) {
        if (candidateProductIds.isEmpty()) return Map.of();

        String placeholders = String.join(",", Collections.nCopies(candidateProductIds.size(), "?"));
        String sql = """
                SELECT review.product_id,
                       AVG(review.total_score) AS average_score,
                       COUNT(*) AS review_count
                FROM reviews review
                JOIN users author ON author.id = review.user_id
                JOIN products product ON product.id = review.product_id
                WHERE author.status = 'ACTIVE'
                  AND product.publication_status = 'PUBLISHED'
                  AND review.product_id IN (%s)
                GROUP BY review.product_id
                """.formatted(placeholders);
        Map<String, ReviewMetrics> metrics = new LinkedHashMap<>();
        jdbc.query(sql, resultSet -> {
            String productId = resultSet.getString("product_id");
            metrics.put(productId, new ReviewMetrics(
                    resultSet.getBigDecimal("average_score"),
                    resultSet.getLong("review_count")
            ));
        }, candidateProductIds.toArray());
        return metrics;
    }

    public record ReviewMetrics(BigDecimal averageScore, long reviewCount) {}
}
