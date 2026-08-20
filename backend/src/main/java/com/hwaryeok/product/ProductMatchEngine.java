package com.hwaryeok.product;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.hwaryeok.ingredient.Ingredient;
import com.hwaryeok.ingredient.IngredientStatus;
import com.hwaryeok.ingredient.ProductIngredient;
import com.hwaryeok.ingredient.ProductIngredientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 브랜드 인지도, 판매량, 광고 문구를 사용하지 않고 연결된 성분과 사용자 피부 신호만으로
 * 제품 순서를 계산한다. 제품의 baseScore는 관리자용 이전 데이터로만 남겨 둔다.
 */
@Service
@Transactional(readOnly = true)
public class ProductMatchEngine {

    private static final String SCORE_BASIS = "성분 55% · 피부 적합 35% · 데이터 신뢰 10%";

    private final ProductIngredientRepository productIngredientRepository;

    public ProductMatchEngine(ProductIngredientRepository productIngredientRepository) {
        this.productIngredientRepository = productIngredientRepository;
    }

    public ProductMatchResult evaluate(Product product, ProductMatchProfile profile) {
        return calculate(product, safe(profile), productIngredientRepository.findByProductId(product.getId()));
    }

    public Map<String, ProductMatchResult> evaluateAll(List<Product> products, ProductMatchProfile profile) {
        if (products.isEmpty()) return Map.of();
        Set<String> ids = products.stream().map(Product::getId).collect(java.util.stream.Collectors.toSet());
        Map<String, List<ProductIngredient>> grouped = new HashMap<>();
        for (ProductIngredient relation : productIngredientRepository.findByProductIds(ids)) {
            grouped.computeIfAbsent(relation.getProduct().getId(), ignored -> new ArrayList<>()).add(relation);
        }
        Map<String, ProductMatchResult> results = new LinkedHashMap<>();
        for (Product product : products) {
            results.put(product.getId(), calculate(product, safe(profile), grouped.getOrDefault(product.getId(), List.of())));
        }
        return results;
    }

    public String scoreBasis() {
        return SCORE_BASIS;
    }

    private ProductMatchResult calculate(Product product, ProductMatchProfile profile, List<ProductIngredient> relations) {
        if (relations.isEmpty()) {
            return new ProductMatchResult(
                    42, 42, 50, 15, "LOW",
                    List.of("아직 연결된 주요 성분 데이터가 적어 보수적으로 계산했어요."),
                    List.of("전성분 근거가 보강되기 전에는 피부 적합도를 확정하기 어려워요."),
                    0, Set.of()
            );
        }

        int ingredientQuality = ingredientQuality(relations);
        MatchSignals signals = compatibility(product, profile, relations);
        int dataConfidence = dataConfidence(product, relations);
        int score = clamp((int) Math.round(
                ingredientQuality * 0.55 + signals.score() * 0.35 + dataConfidence * 0.10
        ), 35, 96);

        List<String> reasons = new ArrayList<>(signals.reasons());
        List<String> evidenceA = relations.stream()
                .map(ProductIngredient::getIngredient)
                .filter(ingredient -> "A".equals(ingredient.getEvidenceLevel()))
                .map(Ingredient::getName)
                .distinct()
                .limit(2)
                .toList();
        if (!evidenceA.isEmpty()) {
            reasons.add("근거 A 성분 " + String.join("·", evidenceA) + "을 주요 순서에서 확인했어요.");
        }
        if (reasons.isEmpty()) reasons.add("연결된 성분의 안전성과 근거 수준을 중심으로 계산했어요.");

        return new ProductMatchResult(
                score,
                ingredientQuality,
                signals.score(),
                dataConfidence,
                confidenceLevel(dataConfidence, relations.size()),
                reasons.stream().distinct().limit(4).toList(),
                signals.cautions().stream().distinct().limit(3).toList(),
                relations.size(),
                signals.matchedConcerns()
        );
    }

    private int ingredientQuality(List<ProductIngredient> relations) {
        double weightedTotal = 0;
        double totalWeight = 0;
        for (ProductIngredient relation : relations) {
            Ingredient ingredient = relation.getIngredient();
            int weight = Math.max(1, 6 - Math.min(relation.getDisplayOrder(), 5));
            weightedTotal += ingredientPoint(ingredient) * weight;
            totalWeight += weight;
        }
        return clamp((int) Math.round(weightedTotal / totalWeight), 35, 96);
    }

    private int ingredientPoint(Ingredient ingredient) {
        int evidenceOffset = switch (ingredient.getEvidenceLevel()) {
            case "A" -> 6;
            case "C" -> -6;
            default -> 0;
        };
        int base = switch (ingredient.getStatus()) {
            case GOOD -> 89;
            case NEUTRAL -> 72;
            case CAUTION -> 52;
        };
        return base + evidenceOffset;
    }

    private MatchSignals compatibility(Product product, ProductMatchProfile profile, List<ProductIngredient> relations) {
        int score = 58;
        LinkedHashSet<String> reasons = new LinkedHashSet<>();
        LinkedHashSet<String> cautions = new LinkedHashSet<>();
        LinkedHashSet<String> matchedConcerns = new LinkedHashSet<>();

        for (ProductIngredient relation : relations) {
            Ingredient ingredient = relation.getIngredient();
            int positionWeight = relation.getDisplayOrder() <= 2 ? 2 : 1;

            String skinFeature = profile.skinType() == null ? null : ingredient.getSkinTypeFeatures().get(profile.skinType());
            if (skinFeature != null) {
                boolean negative = ingredient.getStatus() == IngredientStatus.CAUTION;
                score += negative ? -5 * positionWeight : 4 * positionWeight;
                if (!negative) reasons.add(subject(ingredient.getName()) + " " + profile.skinType() + " 피부 적합 근거에 포함돼요.");
            }

            for (String selectedConcern : profile.concerns()) {
                ConcernMatch concernMatch = concernMatch(selectedConcern, ingredient);
                if (concernMatch.matched()) {
                    score += 4 * positionWeight;
                    matchedConcerns.add(selectedConcern);
                    reasons.add(subject(ingredient.getName()) + " " + selectedConcern + " 고민과 연결돼요.");
                }
            }

            Set<String> tags = ingredient.getTags();
            if ("LOW".equals(profile.hydrationLevel()) && hasAny(tags, "보습", "장벽")) score += 2 * positionWeight;
            if ("HIGH".equals(profile.oilinessLevel()) && tags.contains("유분균형")) score += 3 * positionWeight;
            if ("HIGH".equals(profile.oilinessLevel()) && tags.contains("유분")) score -= 3 * positionWeight;
            if ("HIGH".equals(profile.sensitivityLevel()) && hasAny(tags, "진정", "장벽")) score += 2 * positionWeight;
            if ("HIGH".equals(profile.sensitivityLevel()) && ingredient.getStatus() == IngredientStatus.CAUTION) score -= 4 * positionWeight;
            if ("FREQUENT".equals(profile.breakoutFrequency()) && hasAny(tags, "진정", "유분균형")) score += positionWeight;
            if ("LONG".equals(profile.cleansingTightness()) && hasAny(tags, "보습", "장벽")) score += 2 * positionWeight;
            if ("FREQUENT".equals(profile.rednessFrequency()) && hasAny(tags, "붉은기", "진정")) score += 2 * positionWeight;
            if ("HIGH".equals(profile.poreLevel()) && tags.contains("유분균형")) score += 2 * positionWeight;

            if (isReactionTrigger(profile.reactionTriggers(), ingredient)) {
                score -= 12;
                cautions.add(ingredient.getName() + ": " + cautionText(ingredient));
            } else if (ingredient.getStatus() == IngredientStatus.CAUTION && cautionRelevant(profile, ingredient)) {
                score -= 5;
                cautions.add(ingredient.getName() + ": " + cautionText(ingredient));
            }
        }

        if (profile.environments().stream().anyMatch(value -> List.of("냉난방 건조", "계절 변화").contains(value))
                && relations.stream().map(ProductIngredient::getIngredient).anyMatch(value -> hasAny(value.getTags(), "보습", "장벽"))) {
            score += 3;
            reasons.add("건조한 생활 환경을 고려해 보습·장벽 성분을 더 높게 반영했어요.");
        }
        if (profile.routineContexts().stream().anyMatch(value -> value.contains("면도"))
                && relations.stream().map(ProductIngredient::getIngredient).anyMatch(value -> value.getTags().contains("진정"))) {
            score += 3;
            reasons.add("면도 뒤 불편함을 고려해 진정 성분을 우선 반영했어요.");
        }
        if ("FREQUENT".equals(profile.breakoutFrequency())
                && profile.breakoutZones().stream().anyMatch(value -> List.of("턱·입가", "볼", "얼굴 전체").contains(value))
                && hasIngredientTag(relations, "진정")) {
            score += 3;
            reasons.add("반복되는 트러블 위치를 고려해 진정 성분을 더 높게 반영했어요.");
        }
        if (profile.routineContexts().stream().anyMatch(value -> value.contains("메이크업"))
                && "LIGHT".equals(profile.texturePreference())
                && List.of("토너", "세럼", "젤", "에센스", "앰플").contains(product.getCategory())) {
            score += 3;
            reasons.add("메이크업 전 사용을 고려해 가벼운 제품군을 우선 반영했어요.");
        }
        if (profile.routineContexts().contains("이중 세안") && hasAnyIngredientTag(relations, "보습", "장벽")) {
            score += 2;
            reasons.add("이중 세안 뒤 건조 부담을 고려해 보습·장벽 성분을 반영했어요.");
        }
        if (profile.routineContexts().contains("고기능성 성분 사용") && hasAnyIngredientTag(relations, "진정", "장벽")) {
            score += 2;
            reasons.add("기존 기능성 루틴과 함께 쓸 때의 부담을 고려해 진정·장벽 성분을 반영했어요.");
        }
        if (!"DAILY".equals(profile.sunscreenUsage()) && "선케어".equals(product.getCategory())) {
            score += 4;
            reasons.add("꾸준한 자외선 차단 습관을 만들기 위한 후보로 반영했어요.");
        }
        if ("MINIMAL".equals(profile.routineComplexity()) && List.of("세럼", "앰플", "에센스").contains(product.getCategory())) {
            score -= 2;
            cautions.add("단순한 루틴을 선호한다면 기존 단계 하나를 대체하는 방식으로 사용해보세요.");
        }

        score += textureAdjustment(product, profile.texturePreference());
        return new MatchSignals(clamp(score, 30, 96), List.copyOf(reasons), List.copyOf(cautions), Set.copyOf(matchedConcerns));
    }

    private ConcernMatch concernMatch(String selectedConcern, Ingredient ingredient) {
        Set<String> canonical = canonicalConcerns(selectedConcern);
        if (canonical.stream().anyMatch(ingredient.getConcernFeatures()::containsKey)) return new ConcernMatch(true);
        Set<String> targetTags = switch (selectedConcern) {
            case "유분·번들거림" -> Set.of("유분균형");
            case "트러블·여드름" -> Set.of("진정", "유분균형");
            case "블랙헤드·모공" -> Set.of("유분균형");
            case "붉은기·민감" -> Set.of("붉은기", "진정", "장벽");
            case "장벽·각질" -> Set.of("장벽", "각질");
            case "잡티·칙칙함" -> Set.of("피부톤");
            default -> Set.of();
        };
        return new ConcernMatch(targetTags.stream().anyMatch(ingredient.getTags()::contains));
    }

    private Set<String> canonicalConcerns(String concern) {
        return switch (concern) {
            case "속건조·당김" -> Set.of("속건조");
            case "블랙헤드·모공" -> Set.of("모공");
            case "붉은기·민감" -> Set.of("붉은기", "민감");
            case "장벽·각질" -> Set.of("피부 장벽", "각질");
            case "잡티·칙칙함" -> Set.of("칙칙함");
            case "탄력·잔주름" -> Set.of("탄력");
            default -> Set.of(concern);
        };
    }

    private boolean isReactionTrigger(List<String> triggers, Ingredient ingredient) {
        String source = (ingredient.getName() + " " + ingredient.getEnglishName()).toLowerCase();
        for (String trigger : triggers) {
            if ("아직 모름".equals(trigger)) continue;
            if ("에탄올".equals(trigger) && (source.contains("에탄올") || source.contains("alcohol"))) return true;
            if ("향료".equals(trigger) && (source.contains("향료") || source.contains("fragrance") || source.contains("parfum"))) return true;
            if ("에센셜 오일".equals(trigger) && source.contains("oil")) return true;
            if ("각질 케어 성분".equals(trigger) && ingredient.getTags().contains("각질")) return true;
            if ("고함량 비타민C".equals(trigger) && source.contains("ascorb")) return true;
            if ("레티노이드".equals(trigger) && source.contains("retin")) return true;
        }
        return false;
    }

    private boolean cautionRelevant(ProductMatchProfile profile, Ingredient ingredient) {
        if ("HIGH".equals(profile.sensitivityLevel()) || "민감".equals(profile.skinType())) return true;
        return "HIGH".equals(profile.oilinessLevel()) && ingredient.getTags().contains("유분");
    }

    private String cautionText(Ingredient ingredient) {
        return ingredient.getCaution() == null || ingredient.getCaution().isBlank()
                ? "피부 반응을 살피며 소량부터 사용해보세요."
                : ingredient.getCaution();
    }

    private int dataConfidence(Product product, List<ProductIngredient> relations) {
        int countScore = switch (relations.size()) {
            case 0 -> 15;
            case 1, 2 -> 52;
            case 3 -> 70;
            case 4 -> 78;
            default -> 86;
        };
        double evidenceAverage = relations.stream()
                .map(ProductIngredient::getIngredient)
                .mapToInt(ingredient -> switch (ingredient.getEvidenceLevel()) {
                    case "A" -> 94;
                    case "C" -> 62;
                    default -> 80;
                })
                .average()
                .orElse(40);
        int sourceScore = product.getSourceUrl() == null || product.getSourceUrl().isBlank()
                ? 25
                : product.getSourceCheckedAt() == null ? 55 : 90;
        return clamp((int) Math.round(countScore * 0.6 + evidenceAverage * 0.3 + sourceScore * 0.1), 10, 96);
    }

    private String confidenceLevel(int score, int ingredientCount) {
        if (ingredientCount >= 3 && score >= 70) return "HIGH";
        if (ingredientCount >= 2 && score >= 50) return "MEDIUM";
        return "LOW";
    }

    private int textureAdjustment(Product product, String preference) {
        if (preference == null) return 0;
        if ("LIGHT".equals(preference)) {
            if (List.of("토너", "세럼", "젤", "에센스", "앰플").contains(product.getCategory())) return 3;
            if ("크림".equals(product.getCategory())) return -3;
        }
        if ("RICH".equals(preference) && "크림".equals(product.getCategory())) return 3;
        return 0;
    }

    private boolean hasAny(Set<String> source, String... values) {
        for (String value : values) if (source.contains(value)) return true;
        return false;
    }

    private boolean hasIngredientTag(List<ProductIngredient> relations, String tag) {
        return relations.stream().map(ProductIngredient::getIngredient).anyMatch(value -> value.getTags().contains(tag));
    }

    private boolean hasAnyIngredientTag(List<ProductIngredient> relations, String... tags) {
        return relations.stream().map(ProductIngredient::getIngredient).anyMatch(value -> hasAny(value.getTags(), tags));
    }

    private String subject(String value) {
        if (value == null || value.isBlank()) return "이 성분이";
        char last = value.charAt(value.length() - 1);
        boolean hasFinalConsonant = last >= 0xAC00 && last <= 0xD7A3 && (last - 0xAC00) % 28 != 0;
        return value + (hasFinalConsonant ? "이" : "가");
    }

    private ProductMatchProfile safe(ProductMatchProfile profile) {
        return profile == null ? ProductMatchProfile.neutral() : profile;
    }

    private int clamp(int value, int minimum, int maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    private record MatchSignals(int score, List<String> reasons, List<String> cautions, Set<String> matchedConcerns) {
    }

    private record ConcernMatch(boolean matched) {
    }
}
