package com.hwaryeok.seo;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SeoPageSettingResponse(
        SeoPageKey pageKey,
        String path,
        String displayName,
        String title,
        String description,
        List<String> keywords,
        boolean indexable,
        boolean followLinks,
        String ogTitle,
        String ogDescription,
        String ogImageUrl,
        boolean includeInSitemap,
        SeoChangeFrequency changeFrequency,
        BigDecimal priority,
        Instant updatedAt
) {
    static SeoPageSettingResponse from(SeoPageSetting setting) {
        SeoPageKey pageKey = setting.getPageKey();
        return new SeoPageSettingResponse(
                pageKey,
                pageKey.path(),
                pageKey.displayName(),
                setting.getTitle(),
                setting.getDescription(),
                setting.getKeywords(),
                setting.isIndexable(),
                setting.isFollowLinks(),
                setting.getOgTitle(),
                setting.getOgDescription(),
                setting.getOgImageUrl(),
                setting.isIncludeInSitemap(),
                setting.getChangeFrequency(),
                setting.getPriority(),
                setting.getUpdatedAt()
        );
    }
}
