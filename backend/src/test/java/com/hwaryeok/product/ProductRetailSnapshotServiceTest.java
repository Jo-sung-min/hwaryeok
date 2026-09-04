package com.hwaryeok.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class ProductRetailSnapshotServiceTest {

    private ProductService productService;
    private ProductRetailSnapshotRepository snapshotRepository;
    private ProductRetailSnapshotService service;

    @BeforeEach
    void setUp() {
        productService = Mockito.mock(ProductService.class);
        snapshotRepository = Mockito.mock(ProductRetailSnapshotRepository.class);
        service = new ProductRetailSnapshotService(productService, snapshotRepository);
    }

    @Test
    void returnsMatchedRetailInformation() {
        ProductRetailSnapshot snapshot = new ProductRetailSnapshot(
                "rice-sunscreen",
                "OLIVE_YOUNG",
                "A000000224657",
                "조선미녀 맑은쌀 선크림 50ml+20ml 증정 기획",
                "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000224657",
                "50ml + 20ml",
                20000,
                13500,
                "AVAILABLE",
                LocalDate.of(2026, 9, 4),
                OffsetDateTime.of(2026, 9, 4, 6, 0, 0, 0, ZoneOffset.UTC),
                "20ml 증정품이 포함된 기획 상품"
        );
        when(snapshotRepository.findById("rice-sunscreen")).thenReturn(Optional.of(snapshot));

        ProductRetailSnapshotResponse result = service.findSnapshot("rice-sunscreen");

        verify(productService).getProduct("rice-sunscreen");
        assertThat(result.matched()).isTrue();
        assertThat(result.retailer()).isEqualTo("OLIVE_YOUNG");
        assertThat(result.regularPrice()).isEqualTo(20000);
        assertThat(result.salePrice()).isEqualTo(13500);
        assertThat(result.packageInfo()).isEqualTo("50ml + 20ml");
    }

    @Test
    void returnsUnmatchedStateWhenNoExactRetailProductExists() {
        when(snapshotRepository.findById("mugwort-ampoule")).thenReturn(Optional.empty());

        ProductRetailSnapshotResponse result = service.findSnapshot("mugwort-ampoule");

        verify(productService).getProduct("mugwort-ampoule");
        assertThat(result.matched()).isFalse();
        assertThat(result.productId()).isEqualTo("mugwort-ampoule");
        assertThat(result.retailerUrl()).isNull();
    }
}
