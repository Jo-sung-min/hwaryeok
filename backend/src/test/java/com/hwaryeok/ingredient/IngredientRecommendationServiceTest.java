package com.hwaryeok.ingredient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;

import com.hwaryeok.profile.SkinProfileRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class IngredientRecommendationServiceTest {

    @Mock
    private IngredientRepository ingredientRepository;

    private IngredientRecommendationService service;

    @BeforeEach
    void setUp() {
        service = new IngredientRecommendationService(ingredientRepository);
    }

    @Test
    void combinesCanonicalConcernSkinSignalsEvidenceAndPreferencesWhileExcludingUnsafeCandidates() {
        Ingredient ceramide = ingredient("ceramide", "세라마이드", IngredientStatus.GOOD, "A", 3,
                List.of("장벽", "보습"));
        ceramide.getSkinTypeFeatures().put("건성", "건성 피부의 보습 유지에 도움이 되는 근거예요.");
        ceramide.getConcernFeatures().put("피부 장벽", "피부 장벽 고민과 연결된 근거예요.");

        Ingredient preferred = ingredient("preferred", "선호 진정 성분", IngredientStatus.NEUTRAL, "B", 5,
                List.of("진정"));
        Ingredient caution = ingredient("caution", "주의 성분", IngredientStatus.CAUTION, "A", 1,
                List.of("장벽", "보습"));
        caution.getSkinTypeFeatures().put("건성", "제외돼야 하는 근거예요.");
        Ingredient retinol = ingredient("retinol", "레티놀", IngredientStatus.GOOD, "A", 2,
                List.of("탄력"));

        when(ingredientRepository.findAll()).thenReturn(List.of(preferred, caution, retinol, ceramide));

        var request = new IngredientRecommendationRequest(
                profile("건성", "LOW", "LOW", "LOW", List.of("장벽·각질"), List.of("레티노이드")),
                List.of("missing-id", "preferred", "caution"),
                4
        );
        List<IngredientRecommendationResponse> result = service.recommend(request);

        assertThat(result).extracting(item -> item.ingredient().id())
                .containsExactly("ceramide", "preferred")
                .doesNotContain("caution", "retinol");
        assertThat(result.getFirst().matchedBy())
                .contains("피부 타입 · 건성", "선택 고민: 장벽·각질", "수분·장벽 신호", "볼 건조 신호", "근거 수준 A")
                .noneMatch(label -> label.contains("고민 성분군"));
        assertThat(result.getFirst().reason()).isEqualTo("건성 피부의 보습 유지에 도움이 되는 근거예요.");
        assertThat(result.get(1).preferred()).isTrue();
    }

    @Test
    void respectsPreferencePriorityThenUsesStableDisplayNameAndIdOrdering() {
        Ingredient alpha = ingredient("alpha", "같은 이름", IngredientStatus.GOOD, "B", 7, List.of());
        Ingredient beta = ingredient("beta", "같은 이름", IngredientStatus.GOOD, "B", 7, List.of());
        Ingredient gamma = ingredient("gamma", "가나다", IngredientStatus.GOOD, "B", 8, List.of());
        when(ingredientRepository.findAll()).thenReturn(List.of(gamma, alpha, beta));

        var preferred = service.recommend(new IngredientRecommendationRequest(
                profile("중성", "BALANCED", "BALANCED", "BALANCED", List.of("탄력"), List.of()),
                List.of("beta", "alpha"),
                2
        ));
        assertThat(preferred).extracting(item -> item.ingredient().id()).containsExactly("beta", "alpha");

        var stable = service.recommend(new IngredientRecommendationRequest(
                profile("중성", "BALANCED", "BALANCED", "BALANCED", List.of("탄력"), List.of()),
                List.of(),
                3
        ));
        assertThat(stable).extracting(item -> item.ingredient().id()).containsExactly("alpha", "beta", "gamma");
    }

    @Test
    void rejectsDuplicatePreferredIngredientIdsAfterNormalization() {
        var request = new IngredientRecommendationRequest(
                profile("중성", "BALANCED", "BALANCED", null, List.of("탄력"), List.of()),
                List.of("panthenol", " panthenol "),
                null
        );

        assertThatThrownBy(() -> service.recommend(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("중복");
    }

    private SkinProfileRequest profile(
            String skinType,
            String hydration,
            String oiliness,
            String cheekOiliness,
            List<String> concerns,
            List<String> reactionTriggers
    ) {
        return new SkinProfileRequest(
                skinType, hydration, oiliness, cheekOiliness, "MEDIUM", "OCCASIONAL", "SHORT",
                "OCCASIONAL", "MEDIUM", "BALANCED", "STANDARD", "DAILY",
                reactionTriggers, List.of(), List.of(), List.of(), concerns
        );
    }

    private Ingredient ingredient(
            String id,
            String name,
            IngredientStatus status,
            String evidence,
            int displayOrder,
            List<String> tags
    ) {
        Ingredient ingredient = new Ingredient(id, name, name + " EN", "테스트 역할", "테스트 설명", status, null);
        ingredient.getTags().addAll(tags);
        ReflectionTestUtils.setField(ingredient, "evidenceLevel", evidence);
        ReflectionTestUtils.setField(ingredient, "displayOrder", displayOrder);
        return ingredient;
    }
}
