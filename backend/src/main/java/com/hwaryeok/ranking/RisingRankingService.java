package com.hwaryeok.ranking;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductRepository;
import com.hwaryeok.product.ProductResponse;
import com.hwaryeok.product.ProductService;
import com.hwaryeok.ranking.RisingRankingDtos.CategoryOption;
import com.hwaryeok.ranking.RisingRankingDtos.RankedProduct;
import com.hwaryeok.ranking.RisingRankingDtos.RankingResponse;
import com.hwaryeok.ranking.RisingRankingDtos.Window;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class RisingRankingService {

    private static final int WINDOW_DAYS = 7;
    private static final List<String> CATEGORY_ORDER = List.of(
            "토너", "앰플", "세럼", "에센스", "크림", "로션", "선케어", "마스크팩", "젤", "클렌저"
    );
    private static final String SCORE_BASIS = "최근 7일의 사용자 리뷰 수에서 직전 7일의 리뷰 수를 뺀 증가량 순이에요. "
            + "증가량이 같은 경우 최근 리뷰 수, 최근 평균 리뷰점수, 제품 ID 순으로 정렬해요. "
            + "공개 제품과 활동 중인 사용자의 리뷰만 집계하며 판매량·조회수·관리자 점수는 사용하지 않아요.";

    // Calculate counts in the database; product matching is evaluated only for the requested page.
    // Half-open UTC windows prevent double counting at the exact seven-day boundary.
    private static final String AGGREGATES = """
            WITH review_totals AS (
                SELECT r.product_id,
                       CASE p.category WHEN '선크림' THEN '선케어'
                            WHEN '클렌징폼' THEN '클렌저' ELSE p.category END AS category,
                       COUNT(*) AS review_count,
                       SUM(CASE WHEN r.created_at >= :recentStart THEN 1 ELSE 0 END) AS recent_count,
                       SUM(CASE WHEN r.created_at >= :previousStart AND r.created_at < :recentStart
                                THEN 1 ELSE 0 END) AS previous_count,
                       AVG(CASE WHEN r.created_at >= :recentStart THEN r.total_score ELSE NULL END) AS recent_score
                FROM reviews r
                JOIN users author ON author.id = r.user_id AND author.status = 'ACTIVE'
                JOIN products p ON p.id = r.product_id AND p.publication_status = 'PUBLISHED'
                WHERE r.created_at < :asOf
                GROUP BY r.product_id, p.category
            ), rising AS (
                SELECT review_totals.*, recent_count - previous_count AS review_growth
                FROM review_totals WHERE recent_count > previous_count
            )
            """;

    private final NamedParameterJdbcTemplate jdbc;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final Clock clock;

    @Autowired
    public RisingRankingService(JdbcTemplate jdbc, ProductRepository productRepository, ProductService productService) {
        this(jdbc, productRepository, productService, Clock.systemUTC());
    }

    RisingRankingService(JdbcTemplate jdbc, ProductRepository productRepository, ProductService productService, Clock clock) {
        this.jdbc = new NamedParameterJdbcTemplate(jdbc);
        this.productRepository = productRepository;
        this.productService = productService;
        this.clock = clock;
    }

    public RankingResponse rank(String category, int page, int size) {
        if (page < 0) throw new IllegalArgumentException("페이지 번호는 0 이상이어야 해요.");
        if (size < 1 || size > 50) throw new IllegalArgumentException("페이지 크기는 1~50 사이여야 해요.");
        String selectedCategory = normalizeCategory(category);
        if (selectedCategory.length() > 100) throw new IllegalArgumentException("카테고리를 다시 확인해 주세요.");
        Instant asOf = clock.instant();
        Instant recentStart = asOf.minus(WINDOW_DAYS, ChronoUnit.DAYS);
        Instant previousStart = recentStart.minus(WINDOW_DAYS, ChronoUnit.DAYS);
        long offset = (long) page * size;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("asOf", Timestamp.from(asOf))
                .addValue("recentStart", Timestamp.from(recentStart))
                .addValue("previousStart", Timestamp.from(previousStart))
                .addValue("category", selectedCategory)
                .addValue("limit", size)
                .addValue("offset", offset);

        List<CategoryOption> categories = jdbc.query(AGGREGATES + """
                SELECT category, COUNT(*) AS product_count FROM rising GROUP BY category
                """, params, (rs, row) -> new CategoryOption(rs.getString("category"), rs.getLong("product_count")))
                .stream().sorted(Comparator.comparingInt((CategoryOption option) -> {
                    int index = CATEGORY_ORDER.indexOf(option.name());
                    return index < 0 ? Integer.MAX_VALUE : index;
                }).thenComparing(CategoryOption::name)).toList();
        long total = categories.stream()
                .filter(item -> selectedCategory.isEmpty() || selectedCategory.equals(item.name()))
                .mapToLong(CategoryOption::productCount).sum();

        List<ReviewAggregate> pageItems = offset >= total ? List.of() : jdbc.query(AGGREGATES + """
                SELECT * FROM rising WHERE (:category = '' OR category = :category)
                ORDER BY review_growth DESC, recent_count DESC, recent_score DESC, product_id ASC
                LIMIT :limit OFFSET :offset
                """, params, (rs, row) -> new ReviewAggregate(
                rs.getString("product_id"), rs.getLong("review_count"), rs.getLong("recent_count"),
                rs.getLong("previous_count"), rs.getLong("review_growth"), rs.getBigDecimal("recent_score")));
        List<Product> products = pageItems.isEmpty() ? List.of()
                : productRepository.findAllById(pageItems.stream().map(ReviewAggregate::productId).toList());
        Map<String, ProductResponse> responses = products.isEmpty() ? Map.of() : productService.toNeutralResponses(products);
        List<RankedProduct> content = new ArrayList<>(pageItems.size());
        for (int index = 0; index < pageItems.size(); index++) {
            ReviewAggregate item = pageItems.get(index);
            content.add(new RankedProduct(responses.get(item.productId()), offset + index + 1, item.reviewCount(),
                    item.recentCount(), item.previousCount(), item.growth(),
                    item.recentScore().setScale(1, RoundingMode.HALF_UP)));
        }
        int totalPages = (int) Math.min(Integer.MAX_VALUE, (total + size - 1) / size);
        return new RankingResponse(selectedCategory.isEmpty() ? null : selectedCategory, List.copyOf(content),
                page, size, total, totalPages, offset + size < total, categories,
                new Window(asOf, recentStart, previousStart, WINDOW_DAYS), SCORE_BASIS);
    }

    private String normalizeCategory(String value) {
        if (value == null) return "";
        return switch (value.strip()) {
            case "전체", "전체보기", "전체상품" -> "";
            case "선크림" -> "선케어";
            case "클렌징폼" -> "클렌저";
            default -> value.strip();
        };
    }

    private record ReviewAggregate(String productId, long reviewCount, long recentCount,
                                   long previousCount, long growth, BigDecimal recentScore) { }
}
