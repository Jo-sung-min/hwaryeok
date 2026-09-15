package com.hwaryeok.seo;

public enum SeoPageKey {
    HOME("/", "홈"),
    PRODUCTS("/products", "화장품 탐색"),
    PROMOTIONS("/promotions", "화력 추천"),
    RANKING("/ranking", "성분별 제품 랭킹"),
    COMPARE("/compare", "제품 비교"),
    INGREDIENTS("/ingredients", "성분 사전"),
    EXPERTS("/experts", "전문가 활동"),
    EXPERT_RANKING("/experts/ranking", "전문가 활동 랭킹"),
    QUESTIONS("/questions", "화장품 고민 상담소"),
    REVIEWERS("/reviewers", "리뷰어 랭킹"),
    PRINCIPLES("/principles", "성분 랭킹의 기준"),
    SKIN_CHECK("/skin-check", "나의 성분찾기"),
    RISING_RANKING("/ranking/rising", "급상승 제품 랭킹");

    private final String path;
    private final String displayName;

    SeoPageKey(String path, String displayName) {
        this.path = path;
        this.displayName = displayName;
    }

    public String path() {
        return path;
    }

    public String displayName() {
        return displayName;
    }
}
