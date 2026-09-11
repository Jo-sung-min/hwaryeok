package com.hwaryeok.ingredient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.ingredient.IngredientRankingDtos.CategoryOption;
import com.hwaryeok.ingredient.IngredientRankingDtos.IngredientOption;
import com.hwaryeok.ingredient.IngredientRankingDtos.OptionsResponse;
import com.hwaryeok.ingredient.IngredientRankingDtos.RankedProduct;
import com.hwaryeok.ingredient.IngredientRankingDtos.RankingResponse;
import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductPublicationStatus;
import com.hwaryeok.product.ProductRepository;
import com.hwaryeok.product.ProductResponse;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class IngredientRankingService {

    private static final List<String> CATEGORY_ORDER = List.of(
            "토너", "앰플", "세럼", "에센스", "크림", "로션", "선케어", "마스크팩", "젤", "클렌저"
    );

    private final IngredientRepository ingredientRepository;
    private final ProductRepository productRepository;
    private final ProductIngredientRepository relationRepository;
    private final IngredientFirepowerService firepowerService;
    private final ProductIngredientAmountService productIngredientAmountService;
    private final JdbcTemplate jdbc;

    public IngredientRankingService(IngredientRepository ingredientRepository,
                                    ProductRepository productRepository,
                                    ProductIngredientRepository relationRepository,
                                    IngredientFirepowerService firepowerService,
                                    ProductIngredientAmountService productIngredientAmountService,
                                    JdbcTemplate jdbc) {
        this.ingredientRepository = ingredientRepository;
        this.productRepository = productRepository;
        this.relationRepository = relationRepository;
        this.firepowerService = firepowerService;
        this.productIngredientAmountService = productIngredientAmountService;
        this.jdbc = jdbc;
    }

    public OptionsResponse options() {
        Map<String, Long> counts = jdbc.query("""
                SELECT relation.ingredient_id, COUNT(*) AS product_count
                FROM product_ingredients relation
                JOIN products product ON product.id = relation.product_id
                WHERE product.publication_status = 'PUBLISHED'
                GROUP BY relation.ingredient_id
                """, (rs, row) -> Map.entry(rs.getString("ingredient_id"), rs.getLong("product_count")))
                .stream().collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        List<IngredientOption> ingredients = ingredientRepository.findAll(Sort.by(
                        Sort.Order.desc("featured"), Sort.Order.asc("displayOrder"), Sort.Order.asc("name")
                )).stream()
                .map(ingredient -> new IngredientOption(
                        ingredient.getId(), ingredient.getName(), ingredient.getEnglishName(), ingredient.getRole(),
                        ingredient.getTags().stream().sorted().toList(), counts.getOrDefault(ingredient.getId(), 0L)
                )).toList();
        return new OptionsResponse(ingredients, categories(publishedProducts()));
    }

    public RankingResponse rank(String ingredientId, String category, String requestedSort, int page, int size) {
        if (page < 0) throw new IllegalArgumentException("페이지 번호는 0 이상이어야 해요.");
        if (size < 1 || size > 50) throw new IllegalArgumentException("페이지 크기는 1~50 사이여야 해요.");
        String sort = normalize(requestedSort).toUpperCase(Locale.ROOT);
        if (sort.isEmpty()) sort = "FIREPOWER";
        if (!Set.of("FIREPOWER", "REVIEW").contains(sort)) {
            throw new IllegalArgumentException("성분 기준 또는 사용자 리뷰 순으로 정렬해 주세요.");
        }
        String selectedId = normalize(ingredientId);
        Ingredient ingredient = selectedId.isEmpty() ? null : ingredientRepository.findById(selectedId)
                .orElseThrow(() -> new ResourceNotFoundException("성분을 찾을 수 없어요: " + selectedId));
        String selectedCategory = normalizeCategory(category);

        Map<String, ProductIngredient> relations = ingredient == null ? Map.of()
                : relationRepository.findByIngredientId(ingredient.getId()).stream()
                        .filter(relation -> relation.getProduct().getPublicationStatus() == ProductPublicationStatus.PUBLISHED)
                        .collect(Collectors.toMap(relation -> relation.getProduct().getId(), Function.identity()));
        List<Product> ingredientProducts = ingredient == null ? publishedProducts()
                : relations.values().stream().map(ProductIngredient::getProduct).toList();
        List<CategoryOption> categories = categories(ingredientProducts);
        // Category and ingredient filters precede scoring, ordering and pagination.
        List<Product> candidates = ingredientProducts.stream()
                .filter(product -> selectedCategory.isEmpty() || selectedCategory.equals(normalizeCategory(product.getCategory())))
                .toList();
        Set<String> productIds = candidates.stream().map(Product::getId).collect(Collectors.toSet());
        Map<String, Long> ingredientCounts = ingredient == null || productIds.isEmpty() ? Map.of()
                : relationRepository.countByProductIds(productIds).stream().collect(Collectors.toMap(
                        ProductIngredientRepository.ProductIngredientCount::getProductId,
                        ProductIngredientRepository.ProductIngredientCount::getIngredientCount
                ));
        Map<String, ReviewAggregate> reviews = reviewAggregates(productIds);
        Map<String, ProductIngredientAmountClaim> amountClaims = ingredient == null
                ? Map.of()
                : productIngredientAmountService.findVerifiedClaims(ingredient.getId(), productIds);
        List<RankedProduct> scored = candidates.stream().map(product -> {
            ProductIngredient relation = relations.get(product.getId());
            int firepower = ingredient == null ? product.getBaseScore()
                    : firepowerService.score(
                            ingredient, relation, ingredientCounts.getOrDefault(product.getId(), 0L),
                            amountClaims.get(product.getId())
                    ).firepowerScore();
            ReviewAggregate review = reviews.get(product.getId());
            return new RankedProduct(ProductResponse.from(product), null, firepower,
                    review == null ? null : review.score(), review == null ? 0L : review.count(),
                    relation == null ? null : relation.getConcentrationNote(),
                    relation == null || amountClaims.get(product.getId()) == null
                            ? null
                            : IngredientAmountResponse.from(amountClaims.get(product.getId()), product));
        }).sorted(comparator(sort)).toList();

        int from = (int) Math.min((long) page * size, scored.size());
        int to = Math.min(from + size, scored.size());
        List<RankedProduct> content = new ArrayList<>();
        for (int index = from; index < to; index++) {
            RankedProduct item = scored.get(index);
            Integer rank = "REVIEW".equals(sort) && item.reviewCount() == 0 ? null : index + 1;
            content.add(new RankedProduct(item.product(), rank, item.firepowerScore(),
                    item.reviewScore() == null ? null : item.reviewScore().setScale(1, RoundingMode.HALF_UP),
                    item.reviewCount(), item.concentrationNote(), item.amount()));
        }
        int totalPages = scored.isEmpty() ? 0 : (scored.size() + size - 1) / size;
        return new RankingResponse(ingredient == null ? null : ingredient.getId(),
                ingredient == null ? null : ingredient.getName(),
                selectedCategory.isEmpty() ? null : selectedCategory, sort,
                content, page, size, scored.size(), totalPages, page < totalPages - 1, categories);
    }

    private List<Product> publishedProducts() {
        return productRepository.findAllByPublicationStatus(ProductPublicationStatus.PUBLISHED, Sort.by("id"));
    }

    private List<CategoryOption> categories(List<Product> products) {
        return products.stream().collect(Collectors.groupingBy(
                        product -> normalizeCategory(product.getCategory()), Collectors.counting()
                )).entrySet().stream()
                .map(entry -> new CategoryOption(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingInt((CategoryOption option) -> {
                    int index = CATEGORY_ORDER.indexOf(option.name());
                    return index < 0 ? Integer.MAX_VALUE : index;
                }).thenComparing(CategoryOption::name)).toList();
    }

    private Map<String, ReviewAggregate> reviewAggregates(Set<String> productIds) {
        if (productIds.isEmpty()) return Map.of();
        String placeholders = String.join(",", java.util.Collections.nCopies(productIds.size(), "?"));
        return jdbc.query("""
                SELECT review.product_id, AVG(review.total_score) AS average_score, COUNT(*) AS review_count
                FROM reviews review JOIN users author ON author.id = review.user_id
                WHERE author.status = 'ACTIVE' AND review.product_id IN (
                """ + placeholders + ") GROUP BY review.product_id", (rs, row) -> Map.entry(
                        rs.getString("product_id"), new ReviewAggregate(
                                rs.getBigDecimal("average_score"),
                                rs.getLong("review_count")
                        )), productIds.toArray()).stream()
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private Comparator<RankedProduct> comparator(String sort) {
        Comparator<RankedProduct> comparator = "REVIEW".equals(sort)
                ? Comparator.comparing(RankedProduct::reviewScore, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Comparator.comparingLong(RankedProduct::reviewCount).reversed())
                : Comparator.comparing(RankedProduct::firepowerScore, Comparator.reverseOrder());
        return comparator.thenComparing(item -> item.product().name()).thenComparing(item -> item.product().id());
    }

    private String normalizeCategory(String category) {
        return switch (normalize(category)) {
            case "전체" -> "";
            case "선크림" -> "선케어";
            case "클렌징폼" -> "클렌저";
            default -> normalize(category);
        };
    }

    private String normalize(String value) {
        return value == null ? "" : value.strip();
    }

    private record ReviewAggregate(BigDecimal score, long count) { }
}
