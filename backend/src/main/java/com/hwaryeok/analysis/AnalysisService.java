package com.hwaryeok.analysis;

import java.util.List;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductMatchEngine;
import com.hwaryeok.product.ProductMatchProfile;
import com.hwaryeok.product.ProductMatchResult;
import com.hwaryeok.product.ProductResponse;
import com.hwaryeok.product.ProductService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AnalysisService {

    private static final List<String> ALLOWED_SKIN_TYPES = List.of("건성", "지성", "복합성", "수부지", "중성", "민감");

    private final ProductService productService;
    private final ProductMatchEngine productMatchEngine;

    public AnalysisService(ProductService productService, ProductMatchEngine productMatchEngine) {
        this.productService = productService;
        this.productMatchEngine = productMatchEngine;
    }

    public AnalysisResponse preview(AnalysisRequest request) {
        if (!ALLOWED_SKIN_TYPES.contains(request.skinType())) {
            throw new IllegalArgumentException("지원하지 않는 피부 타입이에요.");
        }

        Product product = productService.getProduct(request.productId());
        ProductMatchResult match = productMatchEngine.evaluate(product, profile(request));
        int grade = ProductResponse.gradeFor(match.score());
        List<String> highlights = match.reasons();
        List<String> cautions = match.cautions().isEmpty()
                ? List.of("새 제품은 작은 부위에 먼저 사용하고 피부 변화를 기록해보세요.")
                : match.cautions();

        return new AnalysisResponse(
                product.getId(),
                ProductResponse.from(product, match, productMatchEngine.scoreBasis()),
                request.skinType(),
                List.copyOf(request.concerns()),
                grade,
                match.score(),
                verdictFor(grade, match.confidenceLevel()),
                highlights,
                cautions,
                scoreDetails(match)
        );
    }

    private ProductMatchProfile profile(AnalysisRequest request) {
        return new ProductMatchProfile(
                request.skinType(), request.hydrationLevel(), request.oilinessLevel(), request.sensitivityLevel(),
                request.breakoutFrequency(), request.cleansingTightness(), request.rednessFrequency(), request.poreLevel(),
                request.texturePreference(), request.routineComplexity(), request.sunscreenUsage(), request.concerns(),
                request.reactionTriggers(), request.breakoutZones(), request.environments(), request.routineContexts()
        );
    }

    private List<AnalysisResponse.ScoreDetail> scoreDetails(ProductMatchResult match) {
        return List.of(
                new AnalysisResponse.ScoreDetail(
                        "성분 구성", match.ingredientQualityScore(), note(match.ingredientQualityScore()), true
                ),
                new AnalysisResponse.ScoreDetail(
                        "내 피부 적합", match.compatibilityScore(), note(match.compatibilityScore()), true
                ),
                new AnalysisResponse.ScoreDetail(
                        "데이터 신뢰", match.dataConfidenceScore(), confidenceNote(match.confidenceLevel()), true
                ),
                new AnalysisResponse.ScoreDetail(
                        "주의 성분 부담", cautionBurden(match), match.cautions().isEmpty() ? "낮음" : "확인 필요", false
                )
        );
    }

    private int cautionBurden(ProductMatchResult match) {
        return Math.min(100, match.cautions().size() * 28);
    }

    private String note(int score) {
        if (score >= 88) return "매우 좋음";
        if (score >= 75) return "좋음";
        if (score >= 60) return "보통";
        return "보완 필요";
    }

    private String confidenceNote(String confidenceLevel) {
        return switch (confidenceLevel) {
            case "HIGH" -> "충분함";
            case "MEDIUM" -> "보통";
            default -> "자료 보강 중";
        };
    }

    private String verdictFor(int grade, String confidenceLevel) {
        if ("LOW".equals(confidenceLevel)) return "성분 자료를 더 확인해보세요";
        return switch (grade) {
            case 1 -> "내 피부에 잘 맞을 가능성이 높아요";
            case 2 -> "잘 맞는 편이에요";
            case 3 -> "조건을 확인하며 사용해볼 만해요";
            case 4 -> "주의 성분을 먼저 확인해보세요";
            default -> "다른 제품을 먼저 살펴보세요";
        };
    }
}
