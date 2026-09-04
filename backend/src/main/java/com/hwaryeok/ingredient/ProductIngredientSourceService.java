package com.hwaryeok.ingredient;

import java.time.LocalDate;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductIngredientSourceService {

    private final JdbcTemplate jdbc;

    public ProductIngredientSourceService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public ProductIngredientSourceResponse findPublished(String productId) {
        return jdbc.query("""
                SELECT source_type, source_url, page_title, checked_at,
                       total_ingredient_count, verification_status
                FROM product_ingredient_sources
                WHERE product_id = ? AND published = TRUE AND verification_status = 'VERIFIED'
                """, (rs, rowNum) -> new ProductIngredientSourceResponse(
                rs.getString("source_type"),
                rs.getString("source_url"),
                rs.getString("page_title"),
                rs.getObject("checked_at", LocalDate.class),
                rs.getInt("total_ingredient_count"),
                rs.getString("verification_status")
        ), productId).stream().findFirst().orElse(null);
    }

    @Transactional
    public void markUnpublished(String productId) {
        jdbc.update("""
                UPDATE product_ingredient_sources
                SET published = FALSE, verification_status = 'PARTIAL', updated_at = CURRENT_TIMESTAMP
                WHERE product_id = ?
                """, productId);
    }
}
