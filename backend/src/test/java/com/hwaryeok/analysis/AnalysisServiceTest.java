package com.hwaryeok.analysis;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;

import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class AnalysisServiceTest {

    @Test
    void calculatesPersonalGradeFromSkinTypeAndConcerns() {
        ProductService productService = Mockito.mock(ProductService.class);
        Product product = new Product("cream", "화력", "수분 크림", "크림", 88, "수분 장벽", "속건조 보습", 30000, "blue", null);
        when(productService.getProduct("cream")).thenReturn(product);
        AnalysisService service = new AnalysisService(productService);

        AnalysisResponse result = service.preview(new AnalysisRequest(
                "cream", "수부지", List.of("속건조", "피부 장벽")
        ));

        assertThat(result.score()).isEqualTo(94);
        assertThat(result.grade()).isEqualTo(1);
        assertThat(result.verdict()).isEqualTo("매우 잘 맞아요");
        assertThat(result.details()).hasSize(5);
    }

    @Test
    void appliesDetailedObservationSignalsToScoreAndGuidance() {
        ProductService productService = Mockito.mock(ProductService.class);
        Product product = new Product("cream", "화력", "수분 앰플", "앰플", 88, "수분 장벽", "속건조 보습", 30000, "blue", null);
        when(productService.getProduct("cream")).thenReturn(product);
        AnalysisService service = new AnalysisService(productService);

        AnalysisResponse result = service.preview(new AnalysisRequest(
                "cream", "수부지", List.of("속건조", "피부 장벽"),
                "LOW", "BALANCED", "HIGH", "OCCASIONAL", "LONG", "OCCASIONAL", "MEDIUM",
                "RICH", "MINIMAL", "SOMETIMES", List.of("향료"), List.of("냉난방 건조")
        ));

        assertThat(result.score()).isEqualTo(100);
        assertThat(result.highlights()).anyMatch(message -> message.contains("세안 후 오래가는 당김"));
        assertThat(result.cautions()).anyMatch(message -> message.contains("전성분"));
        assertThat(result.cautions()).anyMatch(message -> message.contains("기존 단계"));
    }
}
