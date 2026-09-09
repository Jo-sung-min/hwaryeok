package com.hwaryeok.ranking;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.hwaryeok.product.ProductResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public final class WeeklyRankingDtos {

    private WeeklyRankingDtos() { }

    public enum Mode {
        AUTO,
        MANUAL
    }

    public record RankedProduct(
            ProductResponse product,
            long rank,
            long reviewCount,
            BigDecimal reviewScore
    ) { }

    public record RankingResponse(
            LocalDate weekStart,
            LocalDate nextRefreshOn,
            Mode mode,
            String scoreBasis,
            List<RankedProduct> content
    ) { }

    public record UpdateRequest(
            @NotEmpty(message = "노출할 제품을 한 개 이상 선택해 주세요.")
            @Size(max = 10, message = "주간 화력랭킹은 최대 10개까지 노출할 수 있어요.")
            List<
                    @NotBlank(message = "제품 ID를 입력해 주세요.")
                    @Size(max = 64, message = "제품 ID는 64자 이하여야 해요.")
                    String
                    > productIds
    ) { }
}
