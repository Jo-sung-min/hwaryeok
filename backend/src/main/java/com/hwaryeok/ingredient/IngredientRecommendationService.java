package com.hwaryeok.ingredient;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import com.hwaryeok.profile.SkinProfileRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class IngredientRecommendationService {

    private static final Map<String, List<String>> CONCERN_ALIASES = Map.ofEntries(
            Map.entry("속건조·당김", List.of("속건조")),
            Map.entry("유분·번들거림", List.of("유분")),
            Map.entry("트러블·여드름", List.of("트러블", "트러블 흔적")),
            Map.entry("블랙헤드·모공", List.of("모공")),
            Map.entry("붉은기·민감", List.of("붉은기", "민감")),
            Map.entry("장벽·각질", List.of("피부 장벽", "각질")),
            Map.entry("잡티·칙칙함", List.of("잡티 흔적", "칙칙함")),
            Map.entry("탄력·잔주름", List.of("탄력", "잔주름"))
    );

    private static final Map<String, Set<String>> CONCERN_TAGS = Map.ofEntries(
            Map.entry("속건조", Set.of("보습", "장벽")),
            Map.entry("유분", Set.of("유분균형")),
            Map.entry("트러블", Set.of("진정", "유분균형")),
            Map.entry("트러블 흔적", Set.of("진정", "피부톤")),
            Map.entry("모공", Set.of("모공", "유분균형")),
            Map.entry("붉은기", Set.of("붉은기", "진정")),
            Map.entry("민감", Set.of("민감", "진정", "장벽")),
            Map.entry("피부 장벽", Set.of("장벽", "보습")),
            Map.entry("각질", Set.of("각질")),
            Map.entry("잡티 흔적", Set.of("피부톤")),
            Map.entry("칙칙함", Set.of("피부톤", "항산화")),
            Map.entry("탄력", Set.of("탄력", "항산화")),
            Map.entry("잔주름", Set.of("탄력", "항산화"))
    );

    private final IngredientRepository ingredientRepository;

    public IngredientRecommendationService(IngredientRepository ingredientRepository) {
        this.ingredientRepository = ingredientRepository;
    }

    public List<IngredientRecommendationResponse> recommend(IngredientRecommendationRequest request) {
        validateProfileLists(request.profile());
        int limit = request.resolvedLimit();
        if (limit < 1 || limit > 6) {
            throw new IllegalArgumentException("추천 성분 수는 1~6개 사이여야 해요.");
        }
        List<String> preferredIds = normalizePreferredIds(request.preferredIngredientIds());
        SkinProfileRequest profile = request.profile();

        Map<String, Ingredient> uniqueIngredients = new LinkedHashMap<>();
        ingredientRepository.findAll().forEach(ingredient -> uniqueIngredients.putIfAbsent(ingredient.getId(), ingredient));
        Map<String, Integer> preferredPriorities = existingPreferredPriorities(preferredIds, uniqueIngredients);

        return uniqueIngredients.values().stream()
                .filter(ingredient -> ingredient.getStatus() != IngredientStatus.CAUTION)
                .filter(ingredient -> !matchesReactionTrigger(profile.reactionTriggers(), ingredient))
                .map(ingredient -> score(ingredient, profile, preferredPriorities.get(ingredient.getId())))
                .sorted(candidateOrder())
                .limit(limit)
                .map(Candidate::response)
                .toList();
    }

    private Candidate score(Ingredient ingredient, SkinProfileRequest profile, Integer preferredPriority) {
        boolean preferred = preferredPriority != null;
        int score = statusScore(ingredient.getStatus()) + evidenceScore(ingredient.getEvidenceLevel());
        LinkedHashSet<String> matchedBy = new LinkedHashSet<>();
        LinkedHashSet<String> matchedConcerns = new LinkedHashSet<>();
        List<String> reasons = new ArrayList<>();

        String skinFeature = ingredient.getSkinTypeFeatures().get(profile.skinType());
        if (skinFeature != null) {
            score += 34;
            matchedBy.add("피부 타입 · " + profile.skinType());
            reasons.add(skinFeature);
        }

        LinkedHashSet<String> canonicalConcerns = canonicalConcerns(profile.concerns());
        for (String concern : canonicalConcerns) {
            String feature = ingredient.getConcernFeatures().get(concern);
            if (feature != null) {
                score += 24;
                matchedConcerns.add(concern);
                reasons.add(feature);
            }
            Set<String> targetTags = CONCERN_TAGS.getOrDefault(concern, Set.of());
            if (hasAnyTag(ingredient, targetTags)) {
                score += 7;
                matchedConcerns.add(concern);
            }
        }
        String concernMatch = concernMatchLabel(profile.concerns(), matchedConcerns);
        if (concernMatch != null) matchedBy.add(concernMatch);

        for (ProfileSignal signal : profileSignals(profile)) {
            if (hasAnyTag(ingredient, signal.tags())) {
                score += signal.weight();
                matchedBy.add(signal.label());
                if (reasons.isEmpty()) reasons.add(signal.reason());
            }
        }

        if (preferred) {
            score += 22 - Math.min(preferredPriority, 10);
            matchedBy.add("선호 성분");
            if (reasons.isEmpty()) reasons.add("이전에 잘 맞는 성분으로 선택한 기록을 함께 반영했어요.");
        }

        if ("A".equals(ingredient.getEvidenceLevel())) matchedBy.add("근거 수준 A");
        String reason = reasons.isEmpty()
                ? defaultReason(ingredient)
                : reasons.getFirst();
        return new Candidate(
                ingredient,
                score,
                evidenceScore(ingredient.getEvidenceLevel()),
                preferred,
                new IngredientRecommendationResponse(
                        IngredientResponse.from(ingredient),
                        reason,
                        List.copyOf(matchedBy),
                        preferred
                )
        );
    }

    private List<String> normalizePreferredIds(List<String> ingredientIds) {
        List<String> normalized = ingredientIds.stream().map(String::strip).toList();
        if (new LinkedHashSet<>(normalized).size() != normalized.size()) {
            throw new IllegalArgumentException("같은 선호 성분을 중복해서 입력할 수 없어요.");
        }
        return normalized;
    }

    private Map<String, Integer> existingPreferredPriorities(
            List<String> preferredIds,
            Map<String, Ingredient> ingredients
    ) {
        Map<String, Integer> priorities = new LinkedHashMap<>();
        for (String id : preferredIds) {
            Ingredient ingredient = ingredients.get(id);
            if (ingredient == null || ingredient.getStatus() == IngredientStatus.CAUTION) continue;
            priorities.put(id, priorities.size() + 1);
        }
        return priorities;
    }

    private void validateProfileLists(SkinProfileRequest profile) {
        requireUnique(profile.concerns(), "같은 피부 고민을 중복해서 입력할 수 없어요.");
        requireUnique(profile.reactionTriggers(), "같은 반응 유발 요인을 중복해서 입력할 수 없어요.");
        requireUnique(profile.breakoutZones(), "같은 트러블 위치를 중복해서 입력할 수 없어요.");
        requireUnique(profile.environments(), "같은 생활 환경을 중복해서 입력할 수 없어요.");
        requireUnique(profile.routineContexts(), "같은 생활 습관을 중복해서 입력할 수 없어요.");
    }

    private void requireUnique(List<String> values, String message) {
        List<String> normalized = safe(values).stream().map(String::strip).toList();
        if (new LinkedHashSet<>(normalized).size() != normalized.size()) {
            throw new IllegalArgumentException(message);
        }
    }

    private LinkedHashSet<String> canonicalConcerns(List<String> concerns) {
        LinkedHashSet<String> canonical = new LinkedHashSet<>();
        for (String concern : safe(concerns)) {
            canonical.addAll(CONCERN_ALIASES.getOrDefault(concern, List.of(concern)));
        }
        return canonical;
    }

    private String concernMatchLabel(List<String> selectedConcerns, Set<String> matchedConcerns) {
        List<String> labels = safe(selectedConcerns).stream()
                .filter(selected -> CONCERN_ALIASES.getOrDefault(selected, List.of(selected)).stream()
                        .anyMatch(matchedConcerns::contains))
                .distinct()
                .toList();
        if (labels.isEmpty()) return null;
        int visibleCount = Math.min(labels.size(), 2);
        String summary = String.join(", ", labels.subList(0, visibleCount));
        if (labels.size() > visibleCount) summary += " 외 " + (labels.size() - visibleCount) + "개";
        return "선택 고민: " + summary;
    }

    private List<ProfileSignal> profileSignals(SkinProfileRequest profile) {
        List<ProfileSignal> signals = new ArrayList<>();
        if ("LOW".equals(profile.hydrationLevel()) || "LONG".equals(profile.cleansingTightness())) {
            signals.add(new ProfileSignal("수분·장벽 신호", Set.of("보습", "장벽"), 11,
                    "속당김과 세안 후 당김을 고려해 보습·장벽 성분을 우선했어요."));
        }
        if ("HIGH".equals(profile.oilinessLevel())) {
            signals.add(new ProfileSignal("유분 균형 신호", Set.of("유분균형"), 10,
                    "번들거림을 고려해 유분 균형 성분을 우선했어요."));
        }
        if ("LOW".equals(profile.cheekOiliness())) {
            signals.add(new ProfileSignal("볼 건조 신호", Set.of("보습", "장벽"), 7,
                    "볼의 건조함을 고려해 보습을 유지하는 성분을 반영했어요."));
        } else if ("HIGH".equals(profile.cheekOiliness())) {
            signals.add(new ProfileSignal("볼 유분 신호", Set.of("유분균형"), 7,
                    "볼의 유분감을 고려해 산뜻한 균형 성분을 반영했어요."));
        }
        if ("HIGH".equals(profile.sensitivityLevel()) || "FREQUENT".equals(profile.rednessFrequency())) {
            signals.add(new ProfileSignal("민감·붉은기 신호", Set.of("진정", "장벽", "붉은기", "민감"), 11,
                    "민감 반응과 붉어짐을 고려해 진정·장벽 성분을 우선했어요."));
        }
        if ("FREQUENT".equals(profile.breakoutFrequency())) {
            signals.add(new ProfileSignal("트러블 신호", Set.of("진정", "유분균형"), 9,
                    "반복되는 트러블을 고려해 진정과 유분 균형 성분을 반영했어요."));
        }
        if ("HIGH".equals(profile.poreLevel())) {
            signals.add(new ProfileSignal("모공 신호", Set.of("모공", "유분균형"), 8,
                    "눈에 띄는 모공을 고려해 유분 균형 성분을 반영했어요."));
        }
        if (safe(profile.environments()).stream().anyMatch(value -> Set.of("냉난방 건조", "계절 변화").contains(value))) {
            signals.add(new ProfileSignal("생활 환경 · 건조", Set.of("보습", "장벽"), 6,
                    "건조한 생활 환경을 고려해 보습·장벽 성분을 반영했어요."));
        }
        if (safe(profile.environments()).stream().anyMatch(value -> Set.of("마스크 장시간", "미세먼지").contains(value))) {
            signals.add(new ProfileSignal("생활 환경 · 외부 자극", Set.of("진정", "장벽", "항산화"), 5,
                    "반복되는 외부 환경을 고려해 진정·보호 성분을 반영했어요."));
        }
        if (safe(profile.routineContexts()).stream().anyMatch(value -> value.contains("면도"))) {
            signals.add(new ProfileSignal("생활 습관 · 면도", Set.of("진정", "장벽"), 5,
                    "면도 후 피부 부담을 고려해 진정·장벽 성분을 반영했어요."));
        }
        if (!"DAILY".equals(profile.sunscreenUsage())) {
            signals.add(new ProfileSignal("선케어 습관", Set.of("자외선차단", "항산화"), 4,
                    "선케어 습관을 고려해 자외선 보호와 항산화 성분을 반영했어요."));
        }
        return signals;
    }

    private boolean matchesReactionTrigger(List<String> triggers, Ingredient ingredient) {
        String source = (ingredient.getName() + " " + ingredient.getEnglishName()).toLowerCase(Locale.ROOT);
        for (String trigger : safe(triggers)) {
            if ("아직 모름".equals(trigger)) continue;
            if ("에탄올".equals(trigger) && (source.contains("에탄올") || source.contains("alcohol"))) return true;
            if ("향료".equals(trigger) && (source.contains("향료") || source.contains("fragrance") || source.contains("parfum"))) return true;
            if ("에센셜 오일".equals(trigger) && (source.contains("에센셜 오일") || source.contains("essential oil"))) return true;
            if ("각질 케어 성분".equals(trigger) && ingredient.getTags().contains("각질")) return true;
            if ("레티노이드".equals(trigger) && (source.contains("레티놀") || source.contains("레티노이드") || source.contains("retin"))) return true;
            if ("고함량 비타민C".equals(trigger) && (source.contains("비타민c") || source.contains("ascorb"))) return true;
        }
        return false;
    }

    private Comparator<Candidate> candidateOrder() {
        return Comparator.comparingInt(Candidate::score).reversed()
                .thenComparing(Candidate::preferred, Comparator.reverseOrder())
                .thenComparing(Comparator.comparingInt(Candidate::evidenceScore).reversed())
                .thenComparingInt(candidate -> normalizedDisplayOrder(candidate.ingredient()))
                .thenComparing(candidate -> candidate.ingredient().getName())
                .thenComparing(candidate -> candidate.ingredient().getId());
    }

    private int statusScore(IngredientStatus status) {
        return status == IngredientStatus.GOOD ? 6 : 0;
    }

    private int evidenceScore(String evidenceLevel) {
        if ("A".equals(evidenceLevel)) return 8;
        if ("B".equals(evidenceLevel)) return 4;
        if ("C".equals(evidenceLevel)) return 1;
        return 0;
    }

    private int normalizedDisplayOrder(Ingredient ingredient) {
        return ingredient.getDisplayOrder() > 0 ? ingredient.getDisplayOrder() : Integer.MAX_VALUE;
    }

    private boolean hasAnyTag(Ingredient ingredient, Set<String> targets) {
        return targets.stream().anyMatch(ingredient.getTags()::contains);
    }

    private String defaultReason(Ingredient ingredient) {
        if ("A".equals(ingredient.getEvidenceLevel())) {
            return "근거 수준이 높은 성분 중 현재 피부 기준과 함께 비교하기 좋은 후보예요.";
        }
        return ingredient.getDescription();
    }

    private List<String> safe(List<String> values) {
        return values == null ? List.of() : values;
    }

    private record ProfileSignal(String label, Set<String> tags, int weight, String reason) {
    }

    private record Candidate(
            Ingredient ingredient,
            int score,
            int evidenceScore,
            boolean preferred,
            IngredientRecommendationResponse response
    ) {
    }
}
