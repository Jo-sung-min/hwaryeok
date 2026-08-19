package com.hwaryeok.ingredient;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class IngredientFirepowerService {

    private static final String SCORE_VERSION = "ingredient-firepower-v1";
    private static final String DISCLAIMER = "화력 점수는 전성분 순서와 공개 근거를 바탕으로 한 비교 지표이며 의학적 효능을 보장하지 않아요.";

    private final IngredientRepository ingredientRepository;
    private final ProductIngredientRepository productIngredientRepository;

    public IngredientFirepowerService(
            IngredientRepository ingredientRepository,
            ProductIngredientRepository productIngredientRepository
    ) {
        this.ingredientRepository = ingredientRepository;
        this.productIngredientRepository = productIngredientRepository;
    }

    public IngredientFirepowerResponse rankProducts(String ingredientId, int limit) {
        if (limit < 1 || limit > 50) {
            throw new IllegalArgumentException("조회할 제품 수는 1~50 사이여야 해요.");
        }
        Ingredient ingredient = ingredientRepository.findById(ingredientId)
                .orElseThrow(() -> new ResourceNotFoundException("성분을 찾을 수 없어요: " + ingredientId));

        List<ProductIngredient> relations = productIngredientRepository.findByIngredientId(ingredientId);
        Set<String> productIds = relations.stream()
                .map(relation -> relation.getProduct().getId())
                .collect(Collectors.toSet());
        Map<String, Long> ingredientCounts = productIds.isEmpty()
                ? Map.of()
                : productIngredientRepository.countByProductIds(productIds).stream()
                        .collect(Collectors.toMap(
                                ProductIngredientRepository.ProductIngredientCount::getProductId,
                                ProductIngredientRepository.ProductIngredientCount::getIngredientCount
                        ));
        List<IngredientFirepowerProductResponse> products = relations
                .stream()
                .map(relation -> score(
                        ingredient,
                        relation,
                        ingredientCounts.getOrDefault(relation.getProduct().getId(), 0L)
                ))
                .sorted(Comparator.comparingInt(IngredientFirepowerProductResponse::firepowerScore).reversed()
                        .thenComparing(item -> item.product().name()))
                .limit(limit)
                .toList();

        return new IngredientFirepowerResponse(
                ingredient.getId(), ingredient.getName(), SCORE_VERSION, DISCLAIMER, products
        );
    }

    private IngredientFirepowerProductResponse score(
            Ingredient ingredient,
            ProductIngredient relation,
            long ingredientCount
    ) {
        Product product = relation.getProduct();
        int match = 20;
        int concentration = concentrationScore(relation.getDisplayOrder());
        int evidence = evidenceScore(ingredient.getEvidenceLevel());
        int productType = productTypeScore(product.getCategory());
        int synergy = ingredientCount >= 3 ? 8 : 5;
        int stability = switch (ingredient.getEvidenceLevel()) {
            case "A" -> 9;
            case "B" -> 7;
            default -> 5;
        };
        int dataConfidence = relation.getDisplayOrder() <= 3 ? 5 : 3;
        int total = Math.clamp(match + concentration + evidence + productType + synergy + stability + dataConfidence, 0, 100);
        IngredientFirepowerBreakdown breakdown = new IngredientFirepowerBreakdown(
                match, concentration, evidence, productType, synergy, stability, dataConfidence
        );
        return new IngredientFirepowerProductResponse(
                ProductResponse.from(product), total, confidence(total), relation.getConcentrationNote(), breakdown
        );
    }

    private int concentrationScore(int displayOrder) {
        if (displayOrder == 1) return 30;
        if (displayOrder == 2) return 26;
        if (displayOrder == 3) return 21;
        if (displayOrder <= 5) return 15;
        return 8;
    }

    private int evidenceScore(String evidenceLevel) {
        return switch (evidenceLevel) {
            case "A" -> 15;
            case "B" -> 11;
            default -> 7;
        };
    }

    private int productTypeScore(String category) {
        if (containsAny(category, "세럼", "앰플", "에센스", "토너")) return 10;
        if (containsAny(category, "크림", "로션")) return 8;
        if (containsAny(category, "선케어", "선크림")) return 6;
        return 5;
    }

    private boolean containsAny(String value, String... candidates) {
        for (String candidate : candidates) {
            if (value.contains(candidate)) return true;
        }
        return false;
    }

    private String confidence(int score) {
        if (score >= 85) return "HIGH";
        if (score >= 70) return "MEDIUM";
        return "LOW";
    }
}
