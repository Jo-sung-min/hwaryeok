package com.hwaryeok.product;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ProductConcernSearchTest {

    @Test
    void resolvesWrinkleAliasesAndKeepsTheRemainingProductQuery() {
        ProductConcernSearch.Resolution exact = ProductConcernSearch.resolve("눈가 주름");
        ProductConcernSearch.Resolution combined = ProductConcernSearch.resolve("주름 크림");

        assertThat(exact.concern()).isEqualTo("탄력·잔주름");
        assertThat(exact.remainingQuery()).isEmpty();
        assertThat(combined.concern()).isEqualTo("탄력·잔주름");
        assertThat(combined.remainingQuery()).isEqualTo("크림");
        assertThat(ProductConcernSearch.resolveCategory(combined.remainingQuery())).isEqualTo("크림");
        assertThat(ProductConcernSearch.resolveCategory("선크림")).isNull();
        ProductConcernSearch.Resolution multiWord = ProductConcernSearch.resolve("눈가 주름 크림");
        assertThat(multiWord.matchedKeyword()).isEqualTo("눈가 주름");
        assertThat(multiWord.remainingQuery()).isEqualTo("크림");
    }

    @Test
    void resolvesCommonConcernSynonymsWithoutHijackingOrdinaryProductSearches() {
        assertThat(ProductConcernSearch.resolve("미백").concern()).isEqualTo("잡티·칙칙함");
        assertThat(ProductConcernSearch.resolve("홍조 세럼").concern()).isEqualTo("붉은기·민감");
        assertThat(ProductConcernSearch.resolve("홍조 세럼").remainingQuery()).isEqualTo("세럼");
        assertThat(ProductConcernSearch.resolve("다이브인 토너")).isNull();
    }
}
