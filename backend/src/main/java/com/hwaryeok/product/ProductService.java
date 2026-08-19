package com.hwaryeok.product;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

import com.hwaryeok.common.error.ResourceNotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("score", "price", "name", "brand");

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public ProductPageResponse findProducts(String query, String category, Integer grade, int page, int size,
                                            String sort, String direction) {
        if (page < 0) throw new IllegalArgumentException("페이지 번호는 0 이상이어야 해요.");
        if (size < 1 || size > 50) throw new IllegalArgumentException("페이지 크기는 1~50 사이여야 해요.");
        if (grade != null && (grade < 1 || grade > 5)) {
            throw new IllegalArgumentException("화력 등급은 1~5 사이여야 해요.");
        }

        String requestedSort = sort == null ? "" : sort.strip();
        String sortField = ALLOWED_SORT_FIELDS.contains(requestedSort) ? requestedSort : "score";
        String entitySortField = "score".equals(sortField) ? "baseScore" : sortField;
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort pageableSort = Sort.by(sortDirection, entitySortField).and(Sort.by(Sort.Direction.ASC, "id"));
        ScoreRange scoreRange = scoreRange(grade);

        return ProductPageResponse.from(productRepository.search(
                normalize(query),
                normalizeCategory(category),
                scoreRange.minimum(),
                scoreRange.maximum(),
                PageRequest.of(page, size, pageableSort)
        ));
    }

    public ProductResponse findProduct(String id) {
        return ProductResponse.from(getProduct(id));
    }

    public List<ProductResponse> findRelatedProducts(String id, int limit) {
        if (limit < 1 || limit > 10) {
            throw new IllegalArgumentException("관련 제품 수는 1~10 사이여야 해요.");
        }
        Product product = getProduct(id);
        return productRepository.findRelated(
                        product.getId(), product.getCategory(), product.getBaseScore(), PageRequest.of(0, limit)
                ).stream()
                .map(ProductResponse::from)
                .toList();
    }

    public List<ProductResponse> findRanking(String skinType, int limit) {
        return findRanking(skinType, null, null, null, null, List.of(), limit);
    }

    public List<ProductResponse> findRanking(
            String skinType,
            String hydrationLevel,
            String oilinessLevel,
            String sensitivityLevel,
            String texturePreference,
            List<String> concerns,
            int limit
    ) {
        return productRepository.findAll().stream()
                .map(product -> ProductResponse.from(productWithAdjustedScore(
                        product, skinType, hydrationLevel, oilinessLevel, sensitivityLevel, texturePreference,
                        concerns == null ? List.of() : concerns
                )))
                .sorted(Comparator.comparingInt(ProductResponse::score).reversed())
                .limit(Math.clamp(limit, 1, 20))
                .toList();
    }

    public Product getProduct(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("제품을 찾을 수 없어요: " + id));
    }

    private ScoreRange scoreRange(Integer grade) {
        if (grade == null) return new ScoreRange(null, null);
        return switch (grade) {
            case 1 -> new ScoreRange(90, 100);
            case 2 -> new ScoreRange(80, 89);
            case 3 -> new ScoreRange(65, 79);
            case 4 -> new ScoreRange(50, 64);
            case 5 -> new ScoreRange(0, 49);
            default -> throw new IllegalArgumentException("화력 등급은 1~5 사이여야 해요.");
        };
    }

    private String normalize(String value) {
        return value == null ? "" : value.strip();
    }

    private String normalizeCategory(String category) {
        String normalized = normalize(category);
        return "전체".equals(normalized) ? "" : normalized;
    }

    private record ScoreRange(Integer minimum, Integer maximum) {
    }

    private Product productWithAdjustedScore(Product product, String skinType) {
        return productWithAdjustedScore(product, skinType, null, null, null, null, List.of());
    }

    private Product productWithAdjustedScore(
            Product product,
            String skinType,
            String hydrationLevel,
            String oilinessLevel,
            String sensitivityLevel,
            String texturePreference,
            List<String> concerns
    ) {
        int adjustment = switch (skinType == null ? "" : skinType) {
            case "건성" -> product.getBenefit().contains("수분") || product.getSubBenefit().contains("보습") ? 3 : 0;
            case "지성" -> "크림".equals(product.getCategory()) ? -4 : 2;
            case "수부지" -> product.getBenefit().contains("수분") || product.getBenefit().contains("진정") ? 2 : 0;
            case "민감" -> product.getBenefit().contains("진정") || product.getSubBenefit().contains("민감") ? 3 : 0;
            default -> 0;
        };
        String benefits = product.getBenefit() + " " + product.getSubBenefit();
        if ("LOW".equals(hydrationLevel) && (benefits.contains("수분") || benefits.contains("보습"))) adjustment += 3;
        if ("HIGH".equals(oilinessLevel) && "크림".equals(product.getCategory())) adjustment -= 2;
        if ("HIGH".equals(sensitivityLevel) && (benefits.contains("진정") || benefits.contains("장벽") || benefits.contains("민감"))) adjustment += 2;
        if ("LIGHT".equals(texturePreference) && List.of("토너", "세럼", "젤").contains(product.getCategory())) adjustment += 1;
        if ("LIGHT".equals(texturePreference) && "크림".equals(product.getCategory())) adjustment -= 1;
        if ("RICH".equals(texturePreference) && "크림".equals(product.getCategory())) adjustment += 1;
        if (concerns.contains("피부 장벽") && benefits.contains("장벽")) adjustment += 2;
        if (concerns.contains("붉은기") && benefits.contains("진정")) adjustment += 2;
        return new Product(
                product.getId(), product.getBrand(), product.getName(), product.getCategory(),
                Math.clamp(product.getBaseScore() + adjustment, 0, 100), product.getBenefit(),
                product.getSubBenefit(), product.getPrice(), product.getTone(), product.getTag(), product.getImageUrl()
        );
    }
}
