package com.hwaryeok.datasource;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.nio.charset.Charset;
import java.util.List;

import org.junit.jupiter.api.Test;

class KciaIngredientFileParserTest {

    private final KciaIngredientFileParser parser = new KciaIngredientFileParser();

    @Test
    void parsesOfficialCsvColumnsAndQuotedValues() {
        byte[] csv = ("성분코드,성분명,영문명,CAS No,구명칭\n"
                + "1001,나이아신아마이드,Niacinamide,98-92-0,니코틴아마이드\n"
                + "1002,판테놀,Panthenol,81-13-0,\"프로비타민 B5, 덱스판테놀\"\n")
                .getBytes(StandardCharsets.UTF_8);

        List<KciaIngredientRow> result = parser.parse(csv);

        assertThat(result).hasSize(2);
        assertThat(result.getFirst().sourceIngredientId()).isEqualTo("1001");
        assertThat(result.getFirst().standardName()).isEqualTo("나이아신아마이드");
        assertThat(result.get(1).formerName()).isEqualTo("프로비타민 B5, 덱스판테놀");
    }

    @Test
    void rejectsFilesWithoutRequiredColumns() {
        byte[] csv = "이름,설명\n판테놀,보습\n".getBytes(StandardCharsets.UTF_8);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> parser.parse(csv))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("성분코드와 성분명");
    }

    @Test
    void parsesKoreanExcelCsvEncoding() {
        byte[] csv = "성분코드,성분명,영문명\n1001,판테놀,Panthenol\n".getBytes(Charset.forName("MS949"));

        List<KciaIngredientRow> result = parser.parse(csv);

        assertThat(result).singleElement().extracting(KciaIngredientRow::standardName).isEqualTo("판테놀");
    }
}
