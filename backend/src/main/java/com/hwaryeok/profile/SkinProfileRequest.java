package com.hwaryeok.profile;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SkinProfileRequest(
        @NotBlank(message = "피부 타입을 선택해 주세요.")
        @Pattern(regexp = "건성|지성|복합성|수부지|중성|민감", message = "지원하지 않는 피부 타입이에요.")
        String skinType,

        @Pattern(regexp = "LOW|BALANCED|HIGH", message = "수분 상태를 다시 선택해 주세요.")
        String hydrationLevel,

        @Pattern(regexp = "LOW|BALANCED|HIGH", message = "유분 상태를 다시 선택해 주세요.")
        String oilinessLevel,

        @Pattern(regexp = "LOW|MEDIUM|HIGH", message = "민감도를 다시 선택해 주세요.")
        String sensitivityLevel,

        @Pattern(regexp = "RARE|OCCASIONAL|FREQUENT", message = "트러블 빈도를 다시 선택해 주세요.")
        String breakoutFrequency,

        @Pattern(regexp = "NONE|SHORT|LONG", message = "세안 후 당김 상태를 다시 선택해 주세요.")
        String cleansingTightness,

        @Pattern(regexp = "RARE|OCCASIONAL|FREQUENT", message = "붉어짐 빈도를 다시 선택해 주세요.")
        String rednessFrequency,

        @Pattern(regexp = "LOW|MEDIUM|HIGH", message = "모공 체감도를 다시 선택해 주세요.")
        String poreLevel,

        @Pattern(regexp = "LIGHT|BALANCED|RICH", message = "선호 제형을 다시 선택해 주세요.")
        String texturePreference,

        @Pattern(regexp = "MINIMAL|STANDARD|LAYERED", message = "스킨케어 단계 수를 다시 선택해 주세요.")
        String routineComplexity,

        @Pattern(regexp = "RARE|SOMETIMES|DAILY", message = "자외선 차단 습관을 다시 선택해 주세요.")
        String sunscreenUsage,

        @Size(max = 6, message = "반응 유발 요인은 최대 6개까지 선택할 수 있어요.")
        List<@NotBlank @Pattern(regexp = "향료|에탄올|에센셜 오일|각질 케어 성분|레티노이드|고함량 비타민C|아직 모름", message = "지원하지 않는 반응 유발 요인이에요.") String> reactionTriggers,

        @Size(max = 5, message = "트러블 위치는 최대 5개까지 선택할 수 있어요.")
        List<@NotBlank @Pattern(regexp = "이마|코|볼|턱·입가|얼굴 전체", message = "지원하지 않는 트러블 위치예요.") String> breakoutZones,

        @Size(max = 6, message = "생활 환경은 최대 6개까지 선택할 수 있어요.")
        List<@NotBlank @Pattern(regexp = "냉난방 건조|마스크 장시간|야외 활동|미세먼지|계절 변화|수면 부족", message = "지원하지 않는 생활 환경이에요.") String> environments,

        @Size(max = 6, message = "생활 습관은 최대 6개까지 선택할 수 있어요.")
        List<@NotBlank @Pattern(regexp = "면도 자주|면도 후 붉어짐|메이크업 자주|메이크업 밀림|이중 세안|고기능성 성분 사용", message = "지원하지 않는 생활 습관이에요.") String> routineContexts,

        @NotEmpty(message = "피부 고민을 하나 이상 선택해 주세요.")
        @Size(max = 4, message = "피부 고민은 최대 4개까지 선택할 수 있어요.")
        List<
                @NotBlank(message = "피부 고민 값이 비어 있어요.")
                @Pattern(regexp = "속건조|민감|모공|붉은기|피부 장벽|각질|칙칙함|탄력|속건조·당김|유분·번들거림|트러블·여드름|블랙헤드·모공|붉은기·민감|장벽·각질|잡티·칙칙함|탄력·잔주름", message = "지원하지 않는 피부 고민이에요.")
                String
        > concerns
) {
}
