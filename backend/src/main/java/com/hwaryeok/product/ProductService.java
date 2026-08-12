package com.hwaryeok.product;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import com.hwaryeok.common.error.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductResponse> findProducts(String query, String category, Integer grade) {
        String normalizedQuery = query == null ? "" : query.strip().toLowerCase(Locale.KOREAN);
        return productRepository.findAll().stream()
                .filter(product -> normalizedQuery.isBlank()
                        || product.getName().toLowerCase(Locale.KOREAN).contains(normalizedQuery)
                        || product.getBrand().toLowerCase(Locale.KOREAN).contains(normalizedQuery))
                .filter(product -> category == null || category.isBlank() || "전체".equals(category)
                        || product.getCategory().equals(category))
                .map(ProductResponse::from)
                .filter(product -> grade == null || product.grade() == grade)
                .sorted(Comparator.comparingInt(ProductResponse::score).reversed())
                .toList();
    }

    public ProductResponse findProduct(String id) {
        return ProductResponse.from(getProduct(id));
    }

    public List<ProductResponse> findRanking(String skinType, int limit) {
        return productRepository.findAll().stream()
                .map(product -> ProductResponse.from(productWithAdjustedScore(product, skinType)))
                .sorted(Comparator.comparingInt(ProductResponse::score).reversed())
                .limit(Math.clamp(limit, 1, 20))
                .toList();
    }

    public Product getProduct(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("제품을 찾을 수 없어요: " + id));
    }

    private Product productWithAdjustedScore(Product product, String skinType) {
        int adjustment = switch (skinType == null ? "" : skinType) {
            case "건성" -> product.getBenefit().contains("수분") || product.getSubBenefit().contains("보습") ? 3 : 0;
            case "지성" -> "크림".equals(product.getCategory()) ? -4 : 2;
            case "수부지" -> product.getBenefit().contains("수분") || product.getBenefit().contains("진정") ? 2 : 0;
            case "민감" -> product.getBenefit().contains("진정") || product.getSubBenefit().contains("민감") ? 3 : 0;
            default -> 0;
        };
        return new Product(
                product.getId(), product.getBrand(), product.getName(), product.getCategory(),
                Math.clamp(product.getBaseScore() + adjustment, 0, 100), product.getBenefit(),
                product.getSubBenefit(), product.getPrice(), product.getTone(), product.getTag()
        );
    }
}
