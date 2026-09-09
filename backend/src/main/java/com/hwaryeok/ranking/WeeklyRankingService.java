package com.hwaryeok.ranking;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductRepository;
import com.hwaryeok.product.ProductResponse;
import com.hwaryeok.product.ProductService;
import com.hwaryeok.ranking.WeeklyRankingDtos.Mode;
import com.hwaryeok.ranking.WeeklyRankingDtos.RankedProduct;
import com.hwaryeok.ranking.WeeklyRankingDtos.RankingResponse;
import com.hwaryeok.ranking.WeeklyRankingDtos.UpdateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class WeeklyRankingService {

    private static final int MAX_PRODUCTS = 10;
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final String SCORE_BASIS = "매주 월요일 00:00(한국 시간) 직전까지 등록된 사용자 평가를 기준으로 "
            + "평가 개수 내림차순 → 평균 평가점수 내림차순 → 제품 ID 오름차순으로 정렬해요. 공개 상태이며 이미지가 있는 제품만 포함하고, "
            + "평가가 있는 제품이 10개보다 적으면 평가가 없는 제품으로 채워요. 관리자가 이번 주 순서를 수정하면 관리자 순서를 우선해요.";

    private static final String REVIEW_METRICS = """
            WITH review_metrics AS (
                SELECT r.product_id,
                       COUNT(*) AS review_count,
                       AVG(r.total_score) AS review_score
                FROM reviews r
                JOIN users author ON author.id = r.user_id AND author.status = 'ACTIVE'
                WHERE r.created_at < :cutoff
                GROUP BY r.product_id
            )
            """;

    private static final String ELIGIBLE_PRODUCT = """
            p.publication_status = 'PUBLISHED'
            AND p.image_url IS NOT NULL
            AND TRIM(p.image_url) <> ''
            """;

    private final NamedParameterJdbcTemplate jdbc;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final Clock clock;

    @Autowired
    public WeeklyRankingService(
            JdbcTemplate jdbc,
            ProductRepository productRepository,
            ProductService productService
    ) {
        this(jdbc, productRepository, productService, Clock.systemUTC());
    }

    WeeklyRankingService(
            JdbcTemplate jdbc,
            ProductRepository productRepository,
            ProductService productService,
            Clock clock
    ) {
        this.jdbc = new NamedParameterJdbcTemplate(jdbc);
        this.productRepository = productRepository;
        this.productService = productService;
        this.clock = clock;
    }

    public RankingResponse current() {
        WeekWindow window = currentWindow();
        MapSqlParameterSource params = parameters(window);
        boolean overridden = hasOverride(window.weekStart());
        List<ReviewAggregate> aggregates = overridden ? overridden(params) : automatic(params);
        return response(window, overridden ? Mode.MANUAL : Mode.AUTO, aggregates);
    }

    @Transactional
    public RankingResponse replace(UpdateRequest request) {
        List<String> productIds = normalizeAndValidate(request.productIds());
        WeekWindow window = currentWindow();
        MapSqlParameterSource week = new MapSqlParameterSource("weekStart", window.weekStart());
        jdbc.update("DELETE FROM weekly_ranking_overrides WHERE week_start = :weekStart", week);

        MapSqlParameterSource[] batch = new MapSqlParameterSource[productIds.size()];
        for (int index = 0; index < productIds.size(); index++) {
            batch[index] = new MapSqlParameterSource()
                    .addValue("weekStart", window.weekStart())
                    .addValue("productId", productIds.get(index))
                    .addValue("displayOrder", index + 1);
        }
        jdbc.batchUpdate("""
                INSERT INTO weekly_ranking_overrides (week_start, product_id, display_order)
                VALUES (:weekStart, :productId, :displayOrder)
                """, batch);
        return current();
    }

    @Transactional
    public RankingResponse reset() {
        WeekWindow window = currentWindow();
        jdbc.update(
                "DELETE FROM weekly_ranking_overrides WHERE week_start = :weekStart",
                new MapSqlParameterSource("weekStart", window.weekStart())
        );
        return current();
    }

    private List<String> normalizeAndValidate(List<String> requestedIds) {
        if (requestedIds == null || requestedIds.isEmpty() || requestedIds.size() > MAX_PRODUCTS) {
            throw new IllegalArgumentException("주간 화력랭킹은 1개 이상 10개 이하의 제품으로 구성해 주세요.");
        }
        if (requestedIds.stream().anyMatch(productId -> productId == null || productId.isBlank())) {
            throw new IllegalArgumentException("제품 ID를 입력해 주세요.");
        }
        List<String> productIds = requestedIds.stream().map(String::strip).toList();
        if (new HashSet<>(productIds).size() != productIds.size()) {
            throw new IllegalArgumentException("같은 제품은 주간 화력랭킹에 한 번만 등록할 수 있어요.");
        }
        for (String productId : productIds) {
            Product product = productService.getProduct(productId);
            if (product.getImageUrl() == null || product.getImageUrl().isBlank()) {
                throw new IllegalArgumentException("이미지가 등록된 공개 제품만 주간 화력랭킹에 노출할 수 있어요: " + productId);
            }
        }
        return productIds;
    }

    private boolean hasOverride(LocalDate weekStart) {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM weekly_ranking_overrides WHERE week_start = :weekStart",
                new MapSqlParameterSource("weekStart", weekStart),
                Long.class
        );
        return count != null && count > 0;
    }

    private List<ReviewAggregate> automatic(MapSqlParameterSource params) {
        return jdbc.query(REVIEW_METRICS + """
                SELECT p.id AS product_id,
                       COALESCE(metrics.review_count, 0) AS review_count,
                       metrics.review_score
                FROM products p
                LEFT JOIN review_metrics metrics ON metrics.product_id = p.id
                WHERE
                """ + ELIGIBLE_PRODUCT + """
                ORDER BY COALESCE(metrics.review_count, 0) DESC,
                         CASE WHEN metrics.review_score IS NULL THEN 1 ELSE 0 END,
                         metrics.review_score DESC,
                         p.id ASC
                LIMIT 10
                """, params, this::aggregate);
    }

    private List<ReviewAggregate> overridden(MapSqlParameterSource params) {
        return jdbc.query(REVIEW_METRICS + """
                SELECT ranking_override.product_id,
                       COALESCE(metrics.review_count, 0) AS review_count,
                       metrics.review_score
                FROM weekly_ranking_overrides ranking_override
                JOIN products p ON p.id = ranking_override.product_id
                LEFT JOIN review_metrics metrics ON metrics.product_id = ranking_override.product_id
                WHERE ranking_override.week_start = :weekStart
                  AND
                """ + ELIGIBLE_PRODUCT + """
                ORDER BY ranking_override.display_order ASC
                """, params, this::aggregate);
    }

    private ReviewAggregate aggregate(java.sql.ResultSet resultSet, int rowNumber) throws java.sql.SQLException {
        return new ReviewAggregate(
                resultSet.getString("product_id"),
                resultSet.getLong("review_count"),
                resultSet.getBigDecimal("review_score")
        );
    }

    private RankingResponse response(WeekWindow window, Mode mode, List<ReviewAggregate> aggregates) {
        if (aggregates.isEmpty()) {
            return new RankingResponse(
                    window.weekStart(), window.nextRefreshOn(), mode, SCORE_BASIS, List.of()
            );
        }
        List<Product> products = productRepository.findAllById(
                aggregates.stream().map(ReviewAggregate::productId).toList()
        );
        Map<String, ProductResponse> responses = productService.toNeutralResponses(products);
        List<RankedProduct> content = new ArrayList<>(aggregates.size());
        for (int index = 0; index < aggregates.size(); index++) {
            ReviewAggregate aggregate = aggregates.get(index);
            ProductResponse product = responses.get(aggregate.productId());
            if (product == null) continue;
            BigDecimal score = aggregate.reviewScore() == null
                    ? null
                    : aggregate.reviewScore().setScale(1, RoundingMode.HALF_UP);
            content.add(new RankedProduct(product, content.size() + 1L, aggregate.reviewCount(), score));
        }
        return new RankingResponse(
                window.weekStart(), window.nextRefreshOn(), mode, SCORE_BASIS, List.copyOf(content)
        );
    }

    private WeekWindow currentWindow() {
        LocalDate today = LocalDate.ofInstant(clock.instant(), SEOUL);
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Instant cutoff = weekStart.atStartOfDay(SEOUL).toInstant();
        return new WeekWindow(weekStart, weekStart.plusWeeks(1), cutoff);
    }

    private MapSqlParameterSource parameters(WeekWindow window) {
        return new MapSqlParameterSource()
                .addValue("weekStart", window.weekStart())
                .addValue("cutoff", Timestamp.from(window.cutoff()));
    }

    private record WeekWindow(LocalDate weekStart, LocalDate nextRefreshOn, Instant cutoff) { }

    private record ReviewAggregate(String productId, long reviewCount, BigDecimal reviewScore) { }
}
