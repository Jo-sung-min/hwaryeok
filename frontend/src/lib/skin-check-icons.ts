// 나의 성분찾기 선택지의 그림 아이콘. 한 장의 시트(S3)에 모두 담아 두고 위치로 꺼내 쓴다.
// 순서를 바꾸거나 아이콘을 추가하면 version을 올린 뒤 시트를 다시 만들어 올린다
// (scripts/generate-skin-check-icons.mjs). 생성 스크립트가 이 파일을 직접 불러오므로 값 import를 추가하지 않는다.

export const SKIN_CHECK_ICON_SHEET = { version: 1, columns: 10, cell: 128 } as const;

/** 시트 안의 순서. `${문항 키}:${선택지 값}` */
export const SKIN_CHECK_ICON_KEYS = [
  "oilinessLevel:LOW", "oilinessLevel:BALANCED", "oilinessLevel:HIGH",
  "cheekOiliness:LOW", "cheekOiliness:BALANCED", "cheekOiliness:HIGH",
  "hydrationLevel:LOW", "hydrationLevel:BALANCED", "hydrationLevel:HIGH",
  "cleansingTightness:NONE", "cleansingTightness:SHORT", "cleansingTightness:LONG",
  "sensitivityLevel:LOW", "sensitivityLevel:MEDIUM", "sensitivityLevel:HIGH",
  "rednessFrequency:RARE", "rednessFrequency:OCCASIONAL", "rednessFrequency:FREQUENT",
  "breakoutFrequency:RARE", "breakoutFrequency:OCCASIONAL", "breakoutFrequency:FREQUENT",
  "breakoutZones:이마", "breakoutZones:코", "breakoutZones:볼", "breakoutZones:턱·입가", "breakoutZones:얼굴 전체",
  "poreLevel:LOW", "poreLevel:MEDIUM", "poreLevel:HIGH",
  "concerns:속건조·당김", "concerns:유분·번들거림", "concerns:트러블·여드름", "concerns:블랙헤드·모공",
  "concerns:붉은기·민감", "concerns:장벽·각질", "concerns:잡티·칙칙함", "concerns:탄력·잔주름",
  "texturePreference:LIGHT", "texturePreference:BALANCED", "texturePreference:RICH",
  "routineComplexity:MINIMAL", "routineComplexity:STANDARD", "routineComplexity:LAYERED",
  "sunscreenUsage:RARE", "sunscreenUsage:SOMETIMES", "sunscreenUsage:DAILY",
  "reactionTriggers:향료", "reactionTriggers:에탄올", "reactionTriggers:에센셜 오일", "reactionTriggers:각질 케어 성분",
  "reactionTriggers:레티노이드", "reactionTriggers:고함량 비타민C", "reactionTriggers:아직 모름",
  "routineContexts:면도 자주", "routineContexts:면도 후 붉어짐", "routineContexts:메이크업 자주",
  "routineContexts:메이크업 밀림", "routineContexts:이중 세안", "routineContexts:고기능성 성분 사용",
  "environments:냉난방 건조", "environments:마스크 장시간", "environments:야외 활동",
  "environments:미세먼지", "environments:계절 변화", "environments:수면 부족",
] as const;

export const SKIN_CHECK_ICON_ROWS = Math.ceil(SKIN_CHECK_ICON_KEYS.length / SKIN_CHECK_ICON_SHEET.columns);

/** CDN 기준 주소 뒤에 붙는 시트 경로 */
export function skinCheckIconSheetPath(): string {
  return `/assets/skin-check/option-icons-v${SKIN_CHECK_ICON_SHEET.version}.webp`;
}

/** 선택지의 아이콘을 시트에서 잘라 보여 주는 배경 스타일. 시트에 없는 선택지면 null. */
export function skinCheckIconStyle(questionKey: string, value: string, sheetUrl: string) {
  const index = (SKIN_CHECK_ICON_KEYS as readonly string[]).indexOf(`${questionKey}:${value}`);
  if (index < 0) return null;
  const { columns } = SKIN_CHECK_ICON_SHEET;
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    backgroundImage: `url("${sheetUrl}")`,
    backgroundSize: `${columns * 100}% ${SKIN_CHECK_ICON_ROWS * 100}%`,
    backgroundPosition: `${(column / (columns - 1)) * 100}% ${(row / (SKIN_CHECK_ICON_ROWS - 1)) * 100}%`,
  };
}
