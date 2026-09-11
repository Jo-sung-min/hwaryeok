package com.hwaryeok.review;

import static com.hwaryeok.review.AdminReviewDtos.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import com.hwaryeok.common.error.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminReviewService {

    private static final Set<String> KINDS = Set.of("ALL", "USER", "SAMPLE");
    private static final String REVIEW_ROWS = """
            SELECT r.id,
                   CAST('USER' AS VARCHAR(10)) AS review_kind,
                   FALSE AS sample_review,
                   p.id AS product_id,
                   p.brand AS product_brand,
                   p.name AS product_name,
                   p.category AS product_category,
                   p.image_url AS product_image_url,
                   p.publication_status AS product_publication_status,
                   u.id AS author_id,
                   u.nickname AS author_nickname,
                   u.status AS author_status,
                   r.total_score,
                   r.content,
                   r.skin_type,
                   r.usage_period,
                   r.repurchase_yn,
                   fire.average_score AS community_average_score,
                   COALESCE(fire.rating_count, 0) AS community_rating_count,
                   r.created_at,
                   r.updated_at
            FROM reviews r
            JOIN products p ON p.id = r.product_id
            JOIN users u ON u.id = r.user_id
            LEFT JOIN (
                SELECT rating.review_id,
                       AVG(CAST(rating.score AS DECIMAL(12, 4))) AS average_score,
                       COUNT(*) AS rating_count
                FROM review_firepower_ratings rating
                JOIN users voter ON voter.id = rating.voter_id AND voter.status = 'ACTIVE'
                JOIN reviews rated_review ON rated_review.id = rating.review_id
                    AND rated_review.user_id <> rating.voter_id
                GROUP BY rating.review_id
            ) fire ON fire.review_id = r.id

            UNION ALL

            SELECT sample.id,
                   CAST('SAMPLE' AS VARCHAR(10)) AS review_kind,
                   TRUE AS sample_review,
                   p.id AS product_id,
                   p.brand AS product_brand,
                   p.name AS product_name,
                   p.category AS product_category,
                   p.image_url AS product_image_url,
                   p.publication_status AS product_publication_status,
                   CAST(NULL AS VARCHAR(36)) AS author_id,
                   CAST('화력 샘플' AS VARCHAR(40)) AS author_nickname,
                   CAST(NULL AS VARCHAR(20)) AS author_status,
                   sample.total_score,
                   sample.content,
                   sample.skin_type,
                   sample.usage_period,
                   sample.repurchase_yn,
                   CAST(NULL AS DECIMAL(12, 4)) AS community_average_score,
                   CAST(0 AS BIGINT) AS community_rating_count,
                   sample.created_at,
                   sample.updated_at
            FROM product_sample_reviews sample
            JOIN products p ON p.id = sample.product_id
            """;
    private static final String FILTER = """
            WHERE (:kind = 'ALL' OR review_kind = :kind)
              AND (:query = ''
                   OR LOWER(product_brand) LIKE :queryLike
                   OR LOWER(product_name) LIKE :queryLike
                   OR LOWER(COALESCE(author_nickname, '')) LIKE :queryLike
                   OR LOWER(content) LIKE :queryLike)
            """;

    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate namedJdbc;

    public AdminReviewService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.namedJdbc = new NamedParameterJdbcTemplate(jdbc);
    }

    public PageResponse find(String query, String kind, int page, int size) {
        String normalizedQuery = normalizeQuery(query);
        String normalizedKind = normalizeKind(kind);
        validatePage(page, size);

        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("kind", normalizedKind)
                .addValue("query", normalizedQuery)
                .addValue("queryLike", "%" + normalizedQuery.toLowerCase(Locale.ROOT) + "%");
        String rows = "(" + REVIEW_ROWS + ") review_rows ";
        Long count = namedJdbc.queryForObject("SELECT COUNT(*) FROM " + rows + FILTER, parameters, Long.class);
        long total = count == null ? 0 : count;
        long totalPages = (total + size - 1) / size;
        long offset = (long) page * size;
        if (offset >= total) {
            return new PageResponse(List.of(), page, size, total, totalPages, false, normalizedKind, normalizedQuery);
        }

        parameters.addValue("limit", size).addValue("offset", offset);
        List<ItemResponse> content = namedJdbc.query(
                "SELECT * FROM " + rows + FILTER
                        + " ORDER BY created_at DESC, id ASC LIMIT :limit OFFSET :offset",
                parameters,
                (rs, rowNum) -> read(rs)
        );
        return new PageResponse(content, page, size, total, totalPages,
                offset + content.size() < total, normalizedKind, normalizedQuery);
    }

    @Transactional
    public void delete(String id) {
        if (id == null || id.isBlank() || id.length() > 80 || id.indexOf('\u0000') >= 0) {
            throw new IllegalArgumentException("삭제할 리뷰 ID를 다시 확인해 주세요.");
        }
        int deleted = jdbc.update("DELETE FROM reviews WHERE id = ?", id);
        if (deleted == 0) {
            deleted = jdbc.update("DELETE FROM product_sample_reviews WHERE id = ?", id);
        }
        if (deleted == 0) throw new ResourceNotFoundException("삭제할 리뷰를 찾을 수 없어요.");
    }

    private ItemResponse read(ResultSet rs) throws SQLException {
        String authorId = rs.getString("author_id");
        AuthorResponse author = new AuthorResponse(
                authorId,
                rs.getString("author_nickname"),
                rs.getString("author_status")
        );
        BigDecimal communityAverage = rs.getBigDecimal("community_average_score");
        if (communityAverage != null) communityAverage = communityAverage.setScale(1, RoundingMode.HALF_UP);
        return new ItemResponse(
                rs.getString("id"),
                rs.getString("review_kind"),
                rs.getBoolean("sample_review"),
                new ProductResponse(
                        rs.getString("product_id"),
                        rs.getString("product_brand"),
                        rs.getString("product_name"),
                        rs.getString("product_category"),
                        rs.getString("product_image_url"),
                        rs.getString("product_publication_status")
                ),
                author,
                rs.getBigDecimal("total_score"),
                rs.getString("content"),
                rs.getString("skin_type"),
                rs.getString("usage_period"),
                rs.getBoolean("repurchase_yn"),
                communityAverage,
                rs.getLong("community_rating_count"),
                instant(rs, "created_at"),
                instant(rs, "updated_at")
        );
    }

    private String normalizeQuery(String query) {
        if (query == null || query.isBlank()) return "";
        String normalized = query.strip();
        if (normalized.length() > 100 || normalized.indexOf('\u0000') >= 0) {
            throw new IllegalArgumentException("검색어는 100자 이내로 입력해 주세요.");
        }
        return normalized;
    }

    private String normalizeKind(String kind) {
        String normalized = kind == null || kind.isBlank() ? "ALL" : kind.strip().toUpperCase(Locale.ROOT);
        if (!KINDS.contains(normalized)) {
            throw new IllegalArgumentException("리뷰 종류는 전체, 사용자, 샘플 중에서 선택해 주세요.");
        }
        return normalized;
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 50) {
            throw new IllegalArgumentException("페이지는 0 이상, 목록 크기는 1~50 사이여야 해요.");
        }
    }

    private Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp timestamp = rs.getTimestamp(column);
        return timestamp == null ? null : timestamp.toInstant();
    }
}
