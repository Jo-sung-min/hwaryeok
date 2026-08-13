package com.hwaryeok.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class ProductServiceTest {

    private ProductRepository repository;
    private ProductService service;

    @BeforeEach
    void setUp() {
        repository = Mockito.mock(ProductRepository.class);
        service = new ProductService(repository);
    }

    @Test
    void filtersProductsByQueryCategoryAndGrade() {
        List<Product> products = List.of(
                new Product("cream", "화력", "수분 크림", "크림", 94, "수분", "보습", 30000, "blue", null),
                new Product("toner", "화력", "진정 토너", "토너", 82, "진정", "민감", 20000, "sage", null)
        );
        when(repository.search(Mockito.eq("수분"), Mockito.eq("크림"), Mockito.eq(90), Mockito.eq(100), Mockito.any(Pageable.class)))
                .thenAnswer(invocation -> new PageImpl<>(List.of(products.getFirst()), invocation.getArgument(4), 1));

        ProductPageResponse result = service.findProducts("수분", "크림", 1, 0, 12, "score", "desc");

        assertThat(result.content()).extracting(ProductResponse::id).containsExactly("cream");
        assertThat(result.totalElements()).isEqualTo(1);
    }

    @Test
    void returnsSkinAdjustedRanking() {
        when(repository.findAll()).thenReturn(List.of(
                new Product("cream", "화력", "수분 크림", "크림", 88, "수분", "보습", 30000, "blue", null),
                new Product("toner", "화력", "진정 토너", "토너", 87, "진정", "민감", 20000, "sage", null)
        ));

        List<ProductResponse> result = service.findRanking("건성", 10);

        assertThat(result.getFirst().id()).isEqualTo("cream");
        assertThat(result.getFirst().score()).isEqualTo(91);
    }
}
