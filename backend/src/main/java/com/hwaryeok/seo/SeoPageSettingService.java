package com.hwaryeok.seo;

import java.net.URI;
import java.time.Instant;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.hwaryeok.common.error.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SeoPageSettingService {

    private final SeoPageSettingRepository settingRepository;

    public SeoPageSettingService(SeoPageSettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    public List<SeoPageSettingResponse> findAll() {
        Map<SeoPageKey, SeoPageSetting> settings = new EnumMap<>(SeoPageKey.class);
        settingRepository.findAllBy().forEach(setting -> settings.put(setting.getPageKey(), setting));
        return Arrays.stream(SeoPageKey.values())
                .map(pageKey -> response(settings.get(pageKey), pageKey))
                .toList();
    }

    public SeoPageSettingResponse find(SeoPageKey pageKey) {
        return SeoPageSettingResponse.from(get(pageKey));
    }

    @Transactional
    public SeoPageSettingResponse update(SeoPageKey pageKey, String administratorId, SeoPageSettingRequest request) {
        rejectServerManagedFields(request);
        if (Boolean.TRUE.equals(request.includeInSitemap()) && !Boolean.TRUE.equals(request.indexable())) {
            throw new IllegalArgumentException("검색 노출을 막은 페이지는 사이트맵에 포함할 수 없어요.");
        }

        SeoPageSetting setting = get(pageKey);
        setting.update(
                request.title().strip(),
                request.description().strip(),
                normalizeKeywords(request.keywords()),
                request.indexable(),
                request.followLinks(),
                request.ogTitle().strip(),
                request.ogDescription().strip(),
                normalizeOgImageUrl(request.ogImageUrl()),
                request.includeInSitemap(),
                request.changeFrequency(),
                request.priority(),
                administratorId,
                Instant.now()
        );
        return SeoPageSettingResponse.from(setting);
    }

    private SeoPageSetting get(SeoPageKey pageKey) {
        return settingRepository.findByPageKey(pageKey)
                .orElseThrow(() -> new ResourceNotFoundException("SEO 설정을 찾을 수 없어요."));
    }

    private SeoPageSettingResponse response(SeoPageSetting setting, SeoPageKey pageKey) {
        if (setting == null) {
            throw new ResourceNotFoundException(pageKey.displayName() + " SEO 설정을 찾을 수 없어요.");
        }
        return SeoPageSettingResponse.from(setting);
    }

    private void rejectServerManagedFields(SeoPageSettingRequest request) {
        if (request.path() != null || request.displayName() != null) {
            throw new IllegalArgumentException("페이지 경로와 화면 이름은 변경할 수 없어요.");
        }
    }

    private List<String> normalizeKeywords(List<String> requestedKeywords) {
        if (requestedKeywords == null) {
            throw new IllegalArgumentException("검색 키워드 목록을 입력해 주세요.");
        }
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        LinkedHashSet<String> normalizedKeys = new LinkedHashSet<>();
        for (String requestedKeyword : requestedKeywords) {
            if (requestedKeyword == null || requestedKeyword.isBlank()) {
                throw new IllegalArgumentException("빈 검색 키워드는 저장할 수 없어요.");
            }
            String keyword = requestedKeyword.strip();
            String key = keyword.toLowerCase(Locale.ROOT);
            if (!normalizedKeys.add(key)) {
                throw new IllegalArgumentException("같은 검색 키워드는 한 번만 입력해 주세요.");
            }
            normalized.add(keyword);
        }
        return List.copyOf(normalized);
    }

    private String normalizeOgImageUrl(String requestedUrl) {
        if (requestedUrl == null || requestedUrl.isBlank()) return null;
        String value = requestedUrl.strip();
        if (value.indexOf('\\') >= 0 || value.chars().anyMatch(character ->
                Character.isISOControl(character) || Character.isWhitespace(character))) {
            throw invalidOgImageUrl();
        }

        URI uri;
        try {
            uri = URI.create(value);
        } catch (IllegalArgumentException exception) {
            throw invalidOgImageUrl();
        }

        if (value.startsWith("/")) {
            if (value.startsWith("//") || uri.isAbsolute() || uri.getRawAuthority() != null
                    || containsParentSegment(uri.getRawPath())) {
                throw invalidOgImageUrl();
            }
            return value;
        }

        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null) {
            throw invalidOgImageUrl();
        }
        return value;
    }

    private boolean containsParentSegment(String rawPath) {
        if (rawPath == null) return false;
        return Arrays.stream(rawPath.split("/", -1)).anyMatch(".."::equals);
    }

    private IllegalArgumentException invalidOgImageUrl() {
        return new IllegalArgumentException("Open Graph 이미지는 https 주소 또는 /로 시작하는 사이트 내부 경로만 사용할 수 있어요.");
    }
}
