package com.hwaryeok.analysis;

import java.util.ArrayList;
import java.util.List;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductResponse;
import com.hwaryeok.product.ProductService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AnalysisService {

    private static final List<String> ALLOWED_SKIN_TYPES = List.of("건성", "지성", "복합성", "수부지", "중성", "민감");

    private final ProductService productService;

    public AnalysisService(ProductService productService) {
        this.productService = productService;
    }

    public AnalysisResponse preview(AnalysisRequest request) {
        if (!ALLOWED_SKIN_TYPES.contains(request.skinType())) {
            throw new IllegalArgumentException("지원하지 않는 피부 타입이에요.");
        }

        Product product = productService.getProduct(request.productId());
        int score = calculateScore(product, request);
        int grade = ProductResponse.gradeFor(score);
        List<String> highlights = buildHighlights(product, request);
        List<String> cautions = buildCautions(product, request);

        return new AnalysisResponse(
                product.getId(),
                request.skinType(),
                List.copyOf(request.concerns()),
                grade,
                score,
                verdictFor(grade),
                highlights,
                cautions,
                scoreDetails(score, request)
        );
    }

    int calculateScore(Product product, String skinType, List<String> concerns) {
        return calculateScore(product, new AnalysisRequest(
                product.getId(), skinType, concerns,
                null, null, null, null, null, null, null, null, null, null, List.of(), List.of()
        ));
    }

    private int calculateScore(Product product, AnalysisRequest request) {
        int score = product.getBaseScore();
        String skinType = request.skinType();
        List<String> concerns = request.concerns();

        if ("건성".equals(skinType) && containsAny(product, "수분", "보습")) score += 3;
        if ("수부지".equals(skinType) && containsAny(product, "수분", "진정", "균형")) score += 2;
        if ("민감".equals(skinType) && containsAny(product, "진정", "민감", "장벽")) score += 3;
        if ("지성".equals(skinType) && "크림".equals(product.getCategory())) score -= 4;

        for (String concern : concerns) {
            if ("속건조".equals(concern) && containsAny(product, "수분", "보습")) score += 2;
            if ("민감".equals(concern) && containsAny(product, "진정", "민감")) score += 2;
            if ("피부 장벽".equals(concern) && containsAny(product, "장벽")) score += 2;
            if ("붉은기".equals(concern) && containsAny(product, "진정")) score += 2;
        }

        if ("LOW".equals(request.hydrationLevel()) && containsAny(product, "수분", "보습")) score += 3;
        if ("HIGH".equals(request.oilinessLevel()) && "크림".equals(product.getCategory())) score -= 2;
        if ("HIGH".equals(request.oilinessLevel()) && List.of("토너", "세럼", "젤").contains(product.getCategory())) score += 1;
        if ("HIGH".equals(request.sensitivityLevel()) && containsAny(product, "진정", "민감", "장벽")) score += 2;
        if ("FREQUENT".equals(request.breakoutFrequency()) && containsAny(product, "진정", "피지")) score += 1;
        if ("LONG".equals(request.cleansingTightness()) && containsAny(product, "수분", "보습", "장벽")) score += 2;
        if ("FREQUENT".equals(request.rednessFrequency()) && containsAny(product, "진정", "민감")) score += 2;
        if ("LIGHT".equals(request.texturePreference()) && List.of("토너", "세럼", "젤").contains(product.getCategory())) score += 1;
        if ("LIGHT".equals(request.texturePreference()) && "크림".equals(product.getCategory())) score -= 1;
        if ("RICH".equals(request.texturePreference()) && "크림".equals(product.getCategory())) score += 1;
        if (safeList(request.environments()).stream().anyMatch(value -> List.of("냉난방 건조", "계절 변화").contains(value))
                && containsAny(product, "수분", "보습", "장벽")) score += 1;

        return Math.clamp(score, 0, 100);
    }

    private boolean containsAny(Product product, String... keywords) {
        String source = product.getBenefit() + " " + product.getSubBenefit();
        for (String keyword : keywords) {
            if (source.contains(keyword)) return true;
        }
        return false;
    }

    private List<String> buildHighlights(Product product, AnalysisRequest request) {
        List<String> highlights = new ArrayList<>();
        highlights.add(product.getBenefit() + "에 강한 성분 구성이에요.");
        highlights.add(product.getSubBenefit() + " 고민을 함께 챙길 수 있어요.");
        if (request.concerns().contains("민감") || "HIGH".equals(request.sensitivityLevel())) highlights.add("민감 반응 이력을 화력 계산의 우선 기준으로 반영했어요.");
        if ("LONG".equals(request.cleansingTightness())) highlights.add("세안 후 오래가는 당김을 고려해 보습·장벽 신호를 더 중요하게 봤어요.");
        if ("LIGHT".equals(request.texturePreference()) && List.of("토너", "세럼", "젤").contains(product.getCategory())) highlights.add("가볍게 흡수되는 제형 선호와 잘 맞는 제품군이에요.");
        if (!"DAILY".equals(request.sunscreenUsage()) && "선케어".equals(product.getCategory())) highlights.add("꾸준한 자외선 차단 습관을 만들기 위한 후보로 함께 살펴봤어요.");
        return highlights;
    }

    private List<String> buildCautions(Product product, AnalysisRequest request) {
        List<String> cautions = new ArrayList<>();
        if (("지성".equals(request.skinType()) || "HIGH".equals(request.oilinessLevel())) && "크림".equals(product.getCategory())) {
            cautions.add("유분이 많은 부위에는 양을 줄여 얇게 사용해보세요.");
        }
        if (!safeList(request.reactionTriggers()).isEmpty()) cautions.add("반응 이력이 있어 전성분을 확인하고 작은 부위에 먼저 시험해보세요.");
        if ("MINIMAL".equals(request.routineComplexity()) && List.of("에센스", "앰플").contains(product.getCategory())) cautions.add("단순한 루틴을 선호하므로 기존 단계에 하나씩 추가해보세요.");
        if (cautions.isEmpty()) cautions.add("피부 상태는 계절과 환경에 따라 달라질 수 있어요.");
        return cautions;
    }

    private List<AnalysisResponse.ScoreDetail> scoreDetails(int score, AnalysisRequest request) {
        int oilBurden = "HIGH".equals(request.oilinessLevel()) || "지성".equals(request.skinType()) ? 36 : "LOW".equals(request.oilinessLevel()) ? 18 : 24;
        int breakoutRisk = "FREQUENT".equals(request.breakoutFrequency()) ? 34 : "RARE".equals(request.breakoutFrequency()) ? 10 : 20;
        int moistureScore = "LOW".equals(request.hydrationLevel()) ? score : Math.clamp(score + 2, 0, 100);
        return List.of(
                new AnalysisResponse.ScoreDetail("보습력", moistureScore, moistureScore >= 90 ? "매우 좋음" : "좋음", true),
                new AnalysisResponse.ScoreDetail("진정력", Math.clamp(score - 2, 0, 100), "매우 좋음", true),
                new AnalysisResponse.ScoreDetail("피부 장벽", Math.clamp(score + 1, 0, 100), "매우 좋음", true),
                new AnalysisResponse.ScoreDetail("유분 부담", oilBurden, oilBurden <= 25 ? "낮음" : "보통", false),
                new AnalysisResponse.ScoreDetail("트러블 부담", breakoutRisk, breakoutRisk <= 15 ? "낮음" : "관찰 필요", false)
        );
    }

    private List<String> safeList(List<String> values) {
        return values == null ? List.of() : values;
    }

    private String verdictFor(int grade) {
        return switch (grade) {
            case 1 -> "매우 잘 맞아요";
            case 2 -> "잘 맞는 편이에요";
            case 3 -> "무난하게 사용할 수 있어요";
            case 4 -> "주의해서 사용해보세요";
            default -> "다른 제품을 먼저 살펴보세요";
        };
    }
}
