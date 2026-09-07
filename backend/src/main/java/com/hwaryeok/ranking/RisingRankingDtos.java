package com.hwaryeok.ranking;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.hwaryeok.product.ProductResponse;

public final class RisingRankingDtos {

    private RisingRankingDtos() { }

    public record RankedProduct(
            ProductResponse product, long rank, long reviewCount,
            long recentReviewCount, long previousReviewCount, long reviewGrowth,
            BigDecimal recentReviewScore
    ) { }

    public record CategoryOption(String name, long productCount) { }

    public record Window(Instant asOf, Instant recentStart, Instant previousStart, int days) { }

    public record RankingResponse(
            String category, List<RankedProduct> content, int page, int size,
            long totalElements, int totalPages, boolean hasNext,
            List<CategoryOption> categories, Window window, String scoreBasis
    ) { }
}
