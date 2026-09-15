package com.hwaryeok.seo;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SeoPageSettingRequest(
        @NotBlank(message = "SEO 제목을 입력해 주세요.")
        @Size(max = 100, message = "SEO 제목은 100자 이하여야 해요.")
        String title,

        @NotBlank(message = "SEO 설명을 입력해 주세요.")
        @Size(max = 300, message = "SEO 설명은 300자 이하여야 해요.")
        String description,

        @NotNull(message = "검색 키워드 목록을 입력해 주세요.")
        @Size(max = 20, message = "검색 키워드는 최대 20개까지 입력할 수 있어요.")
        List<
                @NotBlank(message = "빈 검색 키워드는 저장할 수 없어요.")
                @Size(max = 60, message = "검색 키워드는 각각 60자 이하여야 해요.")
                String
                > keywords,

        @NotNull(message = "검색 노출 여부를 선택해 주세요.")
        Boolean indexable,

        @NotNull(message = "검색 로봇의 링크 탐색 여부를 선택해 주세요.")
        Boolean followLinks,

        @NotBlank(message = "Open Graph 제목을 입력해 주세요.")
        @Size(max = 100, message = "Open Graph 제목은 100자 이하여야 해요.")
        String ogTitle,

        @NotBlank(message = "Open Graph 설명을 입력해 주세요.")
        @Size(max = 300, message = "Open Graph 설명은 300자 이하여야 해요.")
        String ogDescription,

        @Size(max = 500, message = "Open Graph 이미지 주소는 500자 이하여야 해요.")
        String ogImageUrl,

        @NotNull(message = "사이트맵 포함 여부를 선택해 주세요.")
        Boolean includeInSitemap,

        @NotNull(message = "사이트맵 변경 주기를 선택해 주세요.")
        SeoChangeFrequency changeFrequency,

        @NotNull(message = "사이트맵 우선순위를 입력해 주세요.")
        @DecimalMin(value = "0.0", message = "사이트맵 우선순위는 0 이상이어야 해요.")
        @DecimalMax(value = "1.0", message = "사이트맵 우선순위는 1 이하여야 해요.")
        @Digits(integer = 1, fraction = 2, message = "사이트맵 우선순위는 소수 둘째 자리까지 입력할 수 있어요.")
        BigDecimal priority,

        String path,
        String displayName
) {
}
