package com.hwaryeok.datasource;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class CosmeticDataPipelineServiceTest {

    @Autowired
    private CosmeticDataPipelineService service;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void importsAuthorizedKciaReferenceFileIntoPostgresqlSchema() {
        byte[] csv = ("성분코드,성분명,영문명,CAS No,구명칭\n"
                + "90001,테스트보습성분,Test Moisture Ingredient,123-45-6,테스트구명칭\n")
                .getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "kcia.csv", "text/csv", csv);

        DataImportResultResponse result = service.importKciaDictionary(file, true);

        assertThat(result.status()).isEqualTo("SUCCEEDED");
        assertThat(result.recordsUpserted()).isEqualTo(1);
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM cosmetic_ingredient_references WHERE source_id = 'KCIA_DICTIONARY'",
                Long.class
        )).isEqualTo(1L);
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM cosmetic_ingredient_aliases WHERE normalized_alias = '테스트구명칭'",
                Long.class
        )).isEqualTo(1L);
    }

    @Test
    void publishesOfficialBrandListOnlyWhenEveryIngredientMatches() {
        OfficialIngredientListResponse result = service.saveOfficialIngredientList(
                "rice-sunscreen",
                new OfficialIngredientListRequest(
                        "https://beautyofjoseon.com/products/relief-sun",
                        "조선미녀 맑은 쌀 선크림",
                        LocalDate.of(2026, 9, 4),
                        "쌀 추출물, 나이아신아마이드",
                        true
                )
        );

        assertThat(result.published()).isTrue();
        assertThat(result.verificationStatus()).isEqualTo("VERIFIED");
        assertThat(result.matchedIngredientCount()).isEqualTo(2);
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM product_ingredients WHERE product_id = 'rice-sunscreen'",
                Long.class
        )).isEqualTo(2L);
    }

    @Test
    void keepsPartialOfficialListOutOfPublicIngredientSource() {
        OfficialIngredientListResponse result = service.saveOfficialIngredientList(
                "rice-sunscreen",
                new OfficialIngredientListRequest(
                        "https://beautyofjoseon.com/products/relief-sun",
                        "조선미녀 맑은 쌀 선크림",
                        LocalDate.of(2026, 9, 4),
                        "쌀 추출물, 아직없는성분",
                        true
                )
        );

        assertThat(result.published()).isFalse();
        assertThat(result.verificationStatus()).isEqualTo("PARTIAL");
        assertThat(result.unmatchedIngredients()).containsExactly("아직없는성분");
    }
}
