package com.hwaryeok.product;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CoupangPartnersLinkRequest(
        @Size(max = 1000, message = "쿠팡 파트너스 링크는 1000자 이하여야 해요.")
        @Pattern(
                regexp = "(?i)^(?:https://(?:(?:[a-z0-9-]+\\.)*coupang\\.com|coupa\\.ng)/\\S+)?$",
                message = "쿠팡에서 발급한 https 링크만 입력해 주세요."
        )
        String url
) {
}
