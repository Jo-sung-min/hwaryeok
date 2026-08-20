package com.hwaryeok.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class ProductServiceTest {

    private ProductRepository repository;
    private ProductMatchEngine matchEngine;
    private ProductService service;

    @BeforeEach
    void setUp() {
        repository = Mockito.mock(ProductRepository.class);
        matchEngine = Mockito.mock(ProductMatchEngine.class);
        when(matchEngine.scoreBasis()).thenReturn("성분 55% · 피부 적합 35% · 데이터 신뢰 10%");
        when(matchEngine.evaluateAll(Mockito.anyList(), Mockito.any(ProductMatchProfile.class))).thenAnswer(invocation -> {
            List<Product> products = invocation.getArgument(0);
            java.util.Map<String, ProductMatchResult> results = new java.util.HashMap<>();
            for (Product product : products) {
                int score = "cream".equals(product.getId()) ? 91 : 82;
                results.put(product.getId(), new ProductMatchResult(
                        score, score, 82, 78, "HIGH", List.of("성분 근거"), List.of(), 4, java.util.Set.of("속건조·당김")
                ));
            }
            return results;
        });
        service = new ProductService(repository, matchEngine);
    }

    @Test
    void filtersProductsByQueryCategoryAndGrade() {
        List<Product> products = List.of(
                new Product("cream", "화력", "수분 크림", "크림", 94, "수분", "보습", 30000, "blue", null),
                new Product("toner", "화력", "진정 토너", "토너", 82, "진정", "민감", 20000, "sage", null)
        );
        when(repository.findAllByPublicationStatus(
                Mockito.eq(ProductPublicationStatus.PUBLISHED), Mockito.any(org.springframework.data.domain.Sort.class)
        )).thenReturn(products);

        ProductPageResponse result = service.findProducts("수분", "크림", 1, 0, 12, "score", "desc");

        assertThat(result.content()).extracting(ProductResponse::id).containsExactly("cream");
        assertThat(result.totalElements()).isEqualTo(1);
    }

    @Test
    void returnsSkinAdjustedRanking() {
        when(repository.findAllByPublicationStatus(
                Mockito.eq(ProductPublicationStatus.PUBLISHED), Mockito.any(org.springframework.data.domain.Sort.class)
        )).thenReturn(List.of(
                new Product("cream", "화력", "수분 크림", "크림", 88, "수분", "보습", 30000, "blue", null),
                new Product("toner", "화력", "진정 토너", "토너", 87, "진정", "민감", 20000, "sage", null)
        ));

        List<ProductResponse> result = service.findRanking("건성", 10);

        assertThat(result.getFirst().id()).isEqualTo("cream");
        assertThat(result.getFirst().score()).isEqualTo(91);
        assertThat(result.getFirst().scoreBasis()).contains("성분 55%");
    }

    @Test
    void createsProductFromValidatedAdminInput() {
        AdminProductRequest request = new AdminProductRequest(
                "new-cream", " 화력 ", " 진정 크림 ", "크림", 88,
                "피부 진정", "장벽 보습", 29000, "rose", " 성분 정보 확인 ",
                ProductPublicationStatus.DRAFT, " https://example.com/product ", LocalDate.of(2026, 8, 20)
        );
        when(repository.existsById("new-cream")).thenReturn(false);
        when(repository.save(Mockito.any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse result = service.createProduct(request);

        assertThat(result.id()).isEqualTo("new-cream");
        assertThat(result.brand()).isEqualTo("화력");
        assertThat(result.score()).isEqualTo(88);
        assertThat(result.tag()).isEqualTo("성분 정보 확인");
        assertThat(result.publicationStatus()).isEqualTo(ProductPublicationStatus.DRAFT);
        assertThat(result.sourceUrl()).isEqualTo("https://example.com/product");
    }

    @Test
    void updatesExistingProductWithoutChangingId() {
        Product existing = new Product("cream", "기존", "기존 크림", "크림", 70, "보습", "장벽", 20000, "blue", null);
        when(repository.findById("cream")).thenReturn(java.util.Optional.of(existing));
        AdminProductRequest request = new AdminProductRequest(
                "cream", "새 브랜드", "새 크림", "크림", 92,
                "수분 장벽", "민감 진정", 33000, "sage", null,
                ProductPublicationStatus.PUBLISHED, null, null
        );

        ProductResponse result = service.updateProduct("cream", request);

        assertThat(result.name()).isEqualTo("새 크림");
        assertThat(result.score()).isEqualTo(92);
        assertThat(result.imageUrl()).isNull();
    }

    @Test
    void doesNotReturnDraftProductFromPublicLookup() {
        when(repository.findByIdAndPublicationStatus("draft", ProductPublicationStatus.PUBLISHED))
                .thenReturn(java.util.Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.findProduct("draft"))
                .isInstanceOf(com.hwaryeok.common.error.ResourceNotFoundException.class);
    }
}
