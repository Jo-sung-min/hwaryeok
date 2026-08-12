package com.hwaryeok.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;

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
        when(repository.findAll()).thenReturn(List.of(
                new Product("cream", "화력", "수분 크림", "크림", 94, "수분", "보습", 30000, "blue", null),
                new Product("toner", "화력", "진정 토너", "토너", 82, "진정", "민감", 20000, "sage", null)
        ));

        List<ProductResponse> result = service.findProducts("수분", "크림", 1);

        assertThat(result).extracting(ProductResponse::id).containsExactly("cream");
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
