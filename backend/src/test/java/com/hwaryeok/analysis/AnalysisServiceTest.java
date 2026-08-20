package com.hwaryeok.analysis;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductMatchEngine;
import com.hwaryeok.product.ProductMatchProfile;
import com.hwaryeok.product.ProductMatchResult;
import com.hwaryeok.product.ProductService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class AnalysisServiceTest {

    @Test
    void calculatesPersonalGradeFromSkinTypeAndConcerns() {
        ProductService productService = Mockito.mock(ProductService.class);
        Product product = new Product("cream", "화력", "수분 크림", "크림", 88, "수분 장벽", "속건조 보습", 30000, "blue", null);
        when(productService.getProduct("cream")).thenReturn(product);
        ProductMatchEngine matchEngine = matchEngine(91, List.of("세라마이드가 장벽 고민과 연결돼요."), List.of());
        AnalysisService service = new AnalysisService(productService, matchEngine);

        AnalysisResponse result = service.preview(new AnalysisRequest(
                "cream", "수부지", List.of("속건조", "피부 장벽")
        ));

        assertThat(result.score()).isEqualTo(91);
        assertThat(result.grade()).isEqualTo(1);
        assertThat(result.verdict()).contains("잘 맞을 가능성");
        assertThat(result.details()).hasSize(4);
    }

    @Test
    void appliesDetailedObservationSignalsToScoreAndGuidance() {
        ProductService productService = Mockito.mock(ProductService.class);
        Product product = new Product("cream", "화력", "수분 앰플", "앰플", 88, "수분 장벽", "속건조 보습", 30000, "blue", null);
        when(productService.getProduct("cream")).thenReturn(product);
        ProductMatchEngine matchEngine = matchEngine(
                88,
                List.of("세안 후 당김을 고려해 보습·장벽 성분을 반영했어요."),
                List.of("향료: 피부 반응을 살펴보세요.")
        );
        AnalysisService service = new AnalysisService(productService, matchEngine);

        AnalysisResponse result = service.preview(new AnalysisRequest(
                "cream", "수부지", List.of("속건조", "피부 장벽"),
                "LOW", "BALANCED", "HIGH", "OCCASIONAL", "LONG", "OCCASIONAL", "MEDIUM",
                "RICH", "MINIMAL", "SOMETIMES", List.of("향료"), List.of("냉난방 건조")
        ));

        assertThat(result.score()).isEqualTo(88);
        assertThat(result.highlights()).anyMatch(message -> message.contains("세안 후 당김"));
        assertThat(result.cautions()).anyMatch(message -> message.contains("향료"));
    }

    private ProductMatchEngine matchEngine(int score, List<String> reasons, List<String> cautions) {
        ProductMatchEngine engine = Mockito.mock(ProductMatchEngine.class);
        when(engine.scoreBasis()).thenReturn("성분 55% · 피부 적합 35% · 데이터 신뢰 10%");
        when(engine.evaluate(Mockito.any(Product.class), Mockito.any(ProductMatchProfile.class))).thenReturn(
                new ProductMatchResult(score, 90, 86, 78, "HIGH", reasons, cautions, 4, java.util.Set.of())
        );
        return engine;
    }
}
