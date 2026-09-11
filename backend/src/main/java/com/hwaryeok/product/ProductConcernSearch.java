package com.hwaryeok.product;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 제품명 검색과 피부 고민 검색을 구분한다. 고민 별칭은 완전 일치하는 단어만
 * 소비해 실제 제품명이나 브랜드의 일부를 우연히 고민으로 바꾸지 않는다.
 */
final class ProductConcernSearch {

    private static final Map<String, String> CONCERN_BY_ALIAS = aliases();
    private static final Set<String> PRODUCT_CATEGORIES = Set.of(
            "토너", "세럼", "앰플", "에센스", "크림", "로션", "선케어", "마스크팩", "젤", "클렌저"
    );

    private ProductConcernSearch() {
    }

    static Resolution resolve(String query) {
        String trimmed = query == null ? "" : query.trim();
        if (trimmed.isEmpty()) return null;

        String wholeConcern = CONCERN_BY_ALIAS.get(normalize(trimmed));
        if (wholeConcern != null) return new Resolution(wholeConcern, "", trimmed);

        String[] tokens = trimmed.split("[\\s,]+");
        for (int span = tokens.length; span >= 1; span--) {
            for (int start = 0; start + span <= tokens.length; start++) {
                String phrase = String.join(" ", java.util.Arrays.copyOfRange(tokens, start, start + span));
                String concern = CONCERN_BY_ALIAS.get(normalize(phrase));
                if (concern == null) continue;
                StringBuilder remaining = new StringBuilder();
                for (int tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
                    if ((tokenIndex >= start && tokenIndex < start + span) || tokens[tokenIndex].isBlank()) continue;
                    if (!remaining.isEmpty()) remaining.append(' ');
                    remaining.append(tokens[tokenIndex]);
                }
                return new Resolution(concern, remaining.toString(), phrase);
            }
        }
        return null;
    }

    static String resolveCategory(String remainingQuery) {
        String normalized = remainingQuery == null ? "" : remainingQuery.trim();
        return PRODUCT_CATEGORIES.contains(normalized) ? normalized : null;
    }

    private static Map<String, String> aliases() {
        Map<String, String> aliases = new LinkedHashMap<>();
        add(aliases, "속건조·당김", "보습", "수분", "속건조", "건조", "건조함", "당김", "수분부족", "촉촉");
        add(aliases, "유분·번들거림", "유분", "번들거림", "피지", "기름짐", "지성");
        add(aliases, "트러블·여드름", "트러블", "여드름", "뾰루지", "좁쌀", "면포", "화이트헤드", "피부뒤집어짐");
        add(aliases, "블랙헤드·모공", "모공", "블랙헤드", "늘어진모공", "막힌모공");
        add(aliases, "붉은기·민감", "진정", "붉은기", "홍조", "열감", "자극", "민감", "예민", "면도후");
        add(aliases, "장벽·각질", "장벽", "피부장벽", "장벽강화", "손상", "보호막", "각질", "들뜸", "거칠음", "피부결", "요철", "필링");
        add(aliases, "잡티·칙칙함", "미백", "잡티", "기미", "색소침착", "피부톤", "톤개선", "칙칙함", "다크스팟", "여드름흔적");
        add(aliases, "탄력·잔주름", "주름", "잔주름", "눈가주름", "팔자주름", "주름개선", "안티에이징", "노화", "노화케어", "탄력", "처짐", "리프팅");
        return Map.copyOf(aliases);
    }

    private static void add(Map<String, String> aliases, String concern, String... values) {
        for (String value : values) aliases.put(normalize(value), concern);
    }

    private static String normalize(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFKC)
                .toLowerCase(Locale.KOREAN)
                .replaceAll("[\\s._·/\\-]+", "");
    }

    record Resolution(String concern, String remainingQuery, String matchedKeyword) {
    }
}
