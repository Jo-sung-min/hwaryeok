package com.hwaryeok.product;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import com.hwaryeok.common.error.ResourceNotFoundException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("score", "price", "name", "brand", "ingredient");

    private final ProductRepository productRepository;
    private final ProductMatchEngine productMatchEngine;

    public ProductService(ProductRepository productRepository, ProductMatchEngine productMatchEngine) {
        this.productRepository = productRepository;
        this.productMatchEngine = productMatchEngine;
    }

    public ProductPageResponse findProducts(String query, String category, Integer grade, int page, int size,
                                            String sort, String direction) {
        return findProducts(query, category, grade, null, null, null, page, size, sort, direction, ProductMatchProfile.neutral());
    }

    public ProductPageResponse findProducts(
            String query,
            String category,
            Integer grade,
            String concern,
            Integer maxPrice,
            String confidence,
            int page,
            int size,
            String sort,
            String direction,
            ProductMatchProfile profile
    ) {
        validatePage(page, size, grade);
        String normalizedQuery = normalize(query).toLowerCase(Locale.ROOT);
        String normalizedCategory = normalizeCategory(category);
        String normalizedConcern = normalize(concern);
        String normalizedConfidence = normalize(confidence).toUpperCase(Locale.ROOT);

        List<Product> candidates = productRepository.findAllByPublicationStatus(
                ProductPublicationStatus.PUBLISHED, Sort.by(Sort.Direction.ASC, "id")
        ).stream()
                .filter(product -> normalizedQuery.isEmpty()
                        || product.getName().toLowerCase(Locale.ROOT).contains(normalizedQuery)
                        || product.getBrand().toLowerCase(Locale.ROOT).contains(normalizedQuery))
                .filter(product -> normalizedCategory.isEmpty() || normalizedCategory.equals(product.getCategory()))
                .filter(product -> maxPrice == null || maxPrice <= 0 || product.getPrice() <= maxPrice)
                .toList();

        Map<String, ProductMatchResult> matches = productMatchEngine.evaluateAll(candidates, profile);
        List<ProductResponse> results = candidates.stream()
                .map(product -> ProductResponse.from(product, matches.get(product.getId()), productMatchEngine.scoreBasis()))
                .filter(product -> grade == null || product.grade() == grade)
                .filter(product -> normalizedConcern.isEmpty()
                        || matches.get(product.id()).matchedConcerns().contains(normalizedConcern))
                .filter(product -> normalizedConfidence.isEmpty()
                        || normalizedConfidence.equals(product.confidenceLevel()))
                .sorted(productComparator(sort, direction))
                .toList();

        int fromIndex = Math.min(page * size, results.size());
        int toIndex = Math.min(fromIndex + size, results.size());
        int totalPages = results.isEmpty() ? 0 : (results.size() + size - 1) / size;
        return new ProductPageResponse(
                results.subList(fromIndex, toIndex), page, size, results.size(), totalPages, page + 1 < totalPages
        );
    }

    public ProductResponse findProduct(String id) {
        Product product = getProduct(id);
        return toNeutralResponse(product);
    }

    public ProductResponse toNeutralResponse(Product product) {
        return ProductResponse.from(product, productMatchEngine.evaluate(product, ProductMatchProfile.neutral()), productMatchEngine.scoreBasis());
    }

    public Map<String, ProductResponse> toNeutralResponses(List<Product> products) {
        Map<String, ProductMatchResult> matches = productMatchEngine.evaluateAll(products, ProductMatchProfile.neutral());
        return products.stream().collect(java.util.stream.Collectors.toMap(
                Product::getId,
                product -> ProductResponse.from(product, matches.get(product.getId()), productMatchEngine.scoreBasis())
        ));
    }

    public List<ProductResponse> findAllProducts() {
        return productRepository.findAll(Sort.by("brand").ascending().and(Sort.by("name").ascending())).stream()
                .map(ProductResponse::from)
                .toList();
    }

    @Transactional
    public ProductResponse createProduct(AdminProductRequest request) {
        if (productRepository.existsById(request.id())) {
            throw new ProductAlreadyExistsException(request.id());
        }
        return ProductResponse.from(productRepository.save(request.toProduct()));
    }

    @Transactional
    public ProductResponse updateProduct(String id, AdminProductRequest request) {
        if (!id.equals(request.id())) throw new IllegalArgumentException("제품 ID는 수정할 수 없어요.");
        Product product = getAdminProduct(id);
        Product updated = request.toProduct();
        product.updateDetails(
                updated.getBrand(), updated.getName(), updated.getCategory(), updated.getBaseScore(),
                updated.getBenefit(), updated.getSubBenefit(), updated.getPrice(), updated.getTone(), updated.getTag(),
                updated.getPublicationStatus(), updated.getSourceUrl(), updated.getSourceCheckedAt()
        );
        return ProductResponse.from(product);
    }

    @Transactional
    public void deleteProduct(String id) {
        productRepository.delete(getAdminProduct(id));
    }

    public List<ProductResponse> findRelatedProducts(String id, int limit) {
        if (limit < 1 || limit > 10) throw new IllegalArgumentException("관련 제품 수는 1~10 사이여야 해요.");
        Product selected = getProduct(id);
        List<Product> products = productRepository.findAllByPublicationStatus(
                ProductPublicationStatus.PUBLISHED, Sort.by(Sort.Direction.ASC, "id")
        ).stream().filter(product -> !product.getId().equals(id)).toList();
        Map<String, ProductMatchResult> matches = productMatchEngine.evaluateAll(products, ProductMatchProfile.neutral());
        return products.stream()
                .map(product -> ProductResponse.from(product, matches.get(product.getId()), productMatchEngine.scoreBasis()))
                .sorted(Comparator
                        .comparingInt((ProductResponse product) -> selected.getCategory().equals(product.category()) ? 0 : 1)
                        .thenComparing(Comparator.comparingInt(ProductResponse::score).reversed())
                        .thenComparing(ProductResponse::id))
                .limit(limit)
                .toList();
    }

    public List<ProductResponse> findRanking(String skinType, int limit) {
        return findRanking(new ProductMatchProfile(
                skinType, null, null, null, null, null, null, null, null, null, null,
                List.of(), List.of(), List.of(), List.of(), List.of()
        ), null, limit);
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
        return findRanking(new ProductMatchProfile(
                skinType, hydrationLevel, oilinessLevel, sensitivityLevel, null, null, null, null,
                texturePreference, null, null, concerns, List.of(), List.of(), List.of(), List.of()
        ), null, limit);
    }

    public List<ProductResponse> findRanking(ProductMatchProfile profile, String category, int limit) {
        List<Product> products = productRepository.findAllByPublicationStatus(
                ProductPublicationStatus.PUBLISHED, Sort.by(Sort.Direction.ASC, "id")
        ).stream()
                .filter(product -> category == null || category.isBlank() || "전체".equals(category) || category.equals(product.getCategory()))
                .toList();
        Map<String, ProductMatchResult> matches = productMatchEngine.evaluateAll(products, profile);
        return products.stream()
                .map(product -> ProductResponse.from(product, matches.get(product.getId()), productMatchEngine.scoreBasis()))
                .sorted(Comparator.comparingInt(ProductResponse::score).reversed()
                        .thenComparing(Comparator.comparingInt(ProductResponse::ingredientScore).reversed())
                        .thenComparing(Comparator.comparingInt(ProductResponse::dataConfidenceScore).reversed())
                        .thenComparing(ProductResponse::id))
                .limit(Math.clamp(limit, 1, 50))
                .toList();
    }

    public Product getProduct(String id) {
        return productRepository.findByIdAndPublicationStatus(id, ProductPublicationStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("제품을 찾을 수 없어요: " + id));
    }

    public Product getAdminProduct(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("제품을 찾을 수 없어요: " + id));
    }

    private void validatePage(int page, int size, Integer grade) {
        if (page < 0) throw new IllegalArgumentException("페이지 번호는 0 이상이어야 해요.");
        if (size < 1 || size > 50) throw new IllegalArgumentException("페이지 크기는 1~50 사이여야 해요.");
        if (grade != null && (grade < 1 || grade > 5)) {
            throw new IllegalArgumentException("화력 등급은 1~5 사이여야 해요.");
        }
    }

    private Comparator<ProductResponse> productComparator(String sort, String direction) {
        String requestedSort = normalize(sort);
        String sortField = ALLOWED_SORT_FIELDS.contains(requestedSort) ? requestedSort : "score";
        Comparator<ProductResponse> comparator = switch (sortField) {
            case "price" -> Comparator.comparingInt(ProductResponse::priceValue);
            case "name" -> Comparator.comparing(ProductResponse::name);
            case "brand" -> Comparator.comparing(ProductResponse::brand).thenComparing(ProductResponse::name);
            case "ingredient" -> Comparator.comparingInt(ProductResponse::ingredientScore);
            default -> Comparator.comparingInt(ProductResponse::score)
                    .thenComparingInt(ProductResponse::ingredientScore)
                    .thenComparingInt(ProductResponse::dataConfidenceScore);
        };
        if (!"asc".equalsIgnoreCase(direction)) comparator = comparator.reversed();
        return comparator.thenComparing(ProductResponse::id);
    }

    private String normalize(String value) {
        return value == null ? "" : value.strip();
    }

    private String normalizeCategory(String category) {
        String normalized = normalize(category);
        return "전체".equals(normalized) ? "" : normalized;
    }
}
