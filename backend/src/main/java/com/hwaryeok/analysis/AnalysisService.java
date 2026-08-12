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
        int score = calculateScore(product, request.skinType(), request.concerns());
        int grade = ProductResponse.gradeFor(score);
        List<String> highlights = buildHighlights(product, request.concerns());
        List<String> cautions = buildCautions(product, request.skinType());

        return new AnalysisResponse(
                product.getId(),
                request.skinType(),
                List.copyOf(request.concerns()),
                grade,
                score,
                verdictFor(grade),
                highlights,
                cautions,
                scoreDetails(score, request.skinType())
        );
    }

    int calculateScore(Product product, String skinType, List<String> concerns) {
        int score = product.getBaseScore();

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

        return Math.clamp(score, 0, 100);
    }

    private boolean containsAny(Product product, String... keywords) {
        String source = product.getBenefit() + " " + product.getSubBenefit();
        for (String keyword : keywords) {
            if (source.contains(keyword)) return true;
        }
        return false;
    }

    private List<String> buildHighlights(Product product, List<String> concerns) {
        List<String> highlights = new ArrayList<>();
        highlights.add(product.getBenefit() + "에 강한 성분 구성이에요.");
        highlights.add(product.getSubBenefit() + " 고민을 함께 챙길 수 있어요.");
        if (concerns.contains("민감")) highlights.add("민감한 날에도 부담을 줄이도록 궁합을 계산했어요.");
        return highlights;
    }

    private List<String> buildCautions(Product product, String skinType) {
        if ("지성".equals(skinType) && "크림".equals(product.getCategory())) {
            return List.of("유분이 많은 부위에는 양을 줄여 얇게 사용해보세요.");
        }
        return List.of("피부 상태는 계절과 환경에 따라 달라질 수 있어요.");
    }

    private List<AnalysisResponse.ScoreDetail> scoreDetails(int score, String skinType) {
        int oilBurden = "지성".equals(skinType) ? 32 : 24;
        return List.of(
                new AnalysisResponse.ScoreDetail("보습력", Math.clamp(score + 2, 0, 100), "매우 좋음", true),
                new AnalysisResponse.ScoreDetail("진정력", Math.clamp(score - 2, 0, 100), "매우 좋음", true),
                new AnalysisResponse.ScoreDetail("피부 장벽", Math.clamp(score + 1, 0, 100), "매우 좋음", true),
                new AnalysisResponse.ScoreDetail("유분 부담", oilBurden, oilBurden <= 25 ? "낮음" : "보통", false),
                new AnalysisResponse.ScoreDetail("트러블 위험", 12, "매우 낮음", false)
        );
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
