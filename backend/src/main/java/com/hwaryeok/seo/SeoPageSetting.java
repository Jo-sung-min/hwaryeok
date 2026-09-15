package com.hwaryeok.seo;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "seo_page_settings")
class SeoPageSetting {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "page_key", length = 40, nullable = false)
    private SeoPageKey pageKey;

    @Column(length = 100, nullable = false)
    private String title;

    @Column(length = 300, nullable = false)
    private String description;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "seo_page_keywords", joinColumns = @JoinColumn(name = "page_key"))
    @OrderColumn(name = "display_order")
    @Column(name = "keyword", length = 60, nullable = false)
    private List<String> keywords = new ArrayList<>();

    @Column(nullable = false)
    private boolean indexable;

    @Column(name = "follow_links", nullable = false)
    private boolean followLinks;

    @Column(name = "og_title", length = 100, nullable = false)
    private String ogTitle;

    @Column(name = "og_description", length = 300, nullable = false)
    private String ogDescription;

    @Column(name = "og_image_url", length = 500)
    private String ogImageUrl;

    @Column(name = "include_in_sitemap", nullable = false)
    private boolean includeInSitemap;

    @Enumerated(EnumType.STRING)
    @Column(name = "sitemap_change_frequency", length = 20, nullable = false)
    private SeoChangeFrequency changeFrequency;

    @Column(name = "sitemap_priority", precision = 3, scale = 2, nullable = false)
    private BigDecimal priority;

    @Column(name = "updated_by", length = 36)
    private String updatedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SeoPageSetting() {
    }

    void update(
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
            String updatedBy,
            Instant updatedAt
    ) {
        this.title = title;
        this.description = description;
        this.keywords.clear();
        this.keywords.addAll(keywords);
        this.indexable = indexable;
        this.followLinks = followLinks;
        this.ogTitle = ogTitle;
        this.ogDescription = ogDescription;
        this.ogImageUrl = ogImageUrl;
        this.includeInSitemap = includeInSitemap;
        this.changeFrequency = changeFrequency;
        this.priority = priority;
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
    }

    SeoPageKey getPageKey() { return pageKey; }
    String getTitle() { return title; }
    String getDescription() { return description; }
    List<String> getKeywords() { return List.copyOf(keywords); }
    boolean isIndexable() { return indexable; }
    boolean isFollowLinks() { return followLinks; }
    String getOgTitle() { return ogTitle; }
    String getOgDescription() { return ogDescription; }
    String getOgImageUrl() { return ogImageUrl; }
    boolean isIncludeInSitemap() { return includeInSitemap; }
    SeoChangeFrequency getChangeFrequency() { return changeFrequency; }
    BigDecimal getPriority() { return priority; }
    Instant getUpdatedAt() { return updatedAt; }
}
