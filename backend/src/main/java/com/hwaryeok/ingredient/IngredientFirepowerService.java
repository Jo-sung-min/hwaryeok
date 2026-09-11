package com.hwaryeok.ingredient;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductResponse;
import com.hwaryeok.product.ProductPublicationStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class IngredientFirepowerService {

    private static final String SCORE_VERSION = "ingredient-firepower-v2";
    private static final String DISCLAIMER = "화력 점수는 성분 연결과 검증된 공개 함량 근거를 바탕으로 한 비교 지표예요. 적정 함량 기준이 없는 성분은 수치가 높다고 더 가산하지 않으며 의학적 효능을 보장하지 않아요.";

    private final IngredientRepository ingredientRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final ProductIngredientAmountService productIngredientAmountService;

    public IngredientFirepowerService(
            IngredientRepository ingredientRepository,
            ProductIngredientRepository productIngredientRepository,
            ProductIngredientAmountService productIngredientAmountService
    ) {
        this.ingredientRepository = ingredientRepository;
        this.productIngredientRepository = productIngredientRepository;
        this.productIngredientAmountService = productIngredientAmountService;
    }

    public IngredientFirepowerResponse rankProducts(String ingredientId, int limit) {
        if (limit < 1 || limit > 50) {
            throw new IllegalArgumentException("조회할 제품 수는 1~50 사이여야 해요.");
        }
        Ingredient ingredient = ingredientRepository.findById(ingredientId)
                .orElseThrow(() -> new ResourceNotFoundException("성분을 찾을 수 없어요: " + ingredientId));

        List<ProductIngredient> relations = productIngredientRepository.findByIngredientId(ingredientId).stream()
                .filter(relation -> relation.getProduct().getPublicationStatus() == ProductPublicationStatus.PUBLISHED)
                .toList();
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
        Map<String, ProductIngredientAmountClaim> amountClaims =
                productIngredientAmountService.findVerifiedClaims(ingredientId, productIds);
        List<IngredientFirepowerProductResponse> products = relations
                .stream()
                .map(relation -> score(
                        ingredient,
                        relation,
                        ingredientCounts.getOrDefault(relation.getProduct().getId(), 0L),
                        amountClaims.get(relation.getProduct().getId())
                ))
                .sorted(Comparator.comparingInt(IngredientFirepowerProductResponse::firepowerScore).reversed()
                        .thenComparing(item -> item.product().name()))
                .limit(limit)
                .toList();

        return new IngredientFirepowerResponse(
                ingredient.getId(), ingredient.getName(), SCORE_VERSION, DISCLAIMER, products
        );
    }

    IngredientFirepowerProductResponse score(
            Ingredient ingredient,
            ProductIngredient relation,
            long ingredientCount
    ) {
        ProductIngredientAmountClaim claim = productIngredientAmountService.findVerifiedClaims(
                ingredient.getId(), Set.of(relation.getProduct().getId())
        ).get(relation.getProduct().getId());
        return score(ingredient, relation, ingredientCount, claim);
    }

    IngredientFirepowerProductResponse score(
            Ingredient ingredient,
            ProductIngredient relation,
            long ingredientCount,
            ProductIngredientAmountClaim claim
    ) {
        Product product = relation.getProduct();
        int match = 20;
        int formulationClue = formulationClueScore(relation.getDisplayOrder());
        int amountEvidence = claim == null ? 0 : 4;
        int evidence = evidenceScore(ingredient.getEvidenceLevel());
        int productType = productTypeScore(product.getCategory());
        int synergy = ingredientCount >= 3 ? 8 : 5;
        int stability = switch (ingredient.getEvidenceLevel()) {
            case "A" -> 9;
            case "B" -> 7;
            default -> 5;
        };
        int dataConfidence = claim == null ? 2 : 5;
        int total = Math.clamp(
                match + formulationClue + amountEvidence + evidence + productType + synergy + stability + dataConfidence,
                0,
                100
        );
        IngredientFirepowerBreakdown breakdown = new IngredientFirepowerBreakdown(
                match, formulationClue, amountEvidence, evidence, productType, synergy, stability, dataConfidence
        );
        return new IngredientFirepowerProductResponse(
                ProductResponse.from(product), total, confidence(total), relation.getConcentrationNote(),
                claim == null ? null : IngredientAmountResponse.from(claim, product), breakdown
        );
    }

    private int formulationClueScore(int displayOrder) {
        // 전성분 순서는 처방 단서일 뿐 실제 함량이 아니다. 검증된 수치 근거와 분리해 공개한다.
        if (displayOrder == 1) return 16;
        if (displayOrder == 2) return 14;
        if (displayOrder == 3) return 12;
        if (displayOrder <= 5) return 9;
        return 5;
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
