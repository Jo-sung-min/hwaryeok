import type { QuickSkinProfile } from "./quick-profile";

export const SKIN_CHECK_DRAFT_KEY = "hwaryeok-skin-check-draft-v2";
export const DRAFT_MAX_AGE = 24 * 60 * 60 * 1000;
export type AnswerKey = Exclude<keyof QuickSkinProfile, "skinType"> | "cheekOiliness";
export type SkinAnswers = Partial<Record<AnswerKey, string | string[]>>;
export type CheckView = number | "review" | "result";
export type CheckIcon = "drop" | "sun" | "waves" | "shield" | "flower" | "sparkles" | "clock" | "layers" | "leaf" | "wind";
type Option = { value: string; label: string; description: string; icon: CheckIcon };
export type SkinQuestion = { key: AnswerKey; group: string; tone: "water" | "rose" | "sage" | "lilac"; title: string; hint: string; note: string; icon: CheckIcon; options: Option[]; multiple?: boolean; max?: number; min?: number; exclusive?: string };
const option = (value: string, label: string, description: string, icon: CheckIcon): Option => ({ value, label, description, icon });

export const skinQuestions: SkinQuestion[] = [
  { key: "oilinessLevel", group: "유수분 관찰", tone: "water", icon: "sun", title: "오후에 이마와 코는 얼마나 번들거리나요?", hint: "최근 2주, 평소 생활에서 가장 가까운 상태를 골라주세요.", note: "피부 타입 이름을 몰라도 괜찮아요. 관찰한 느낌부터 시작해요.", options: [option("LOW", "유분이 거의 없어요", "오후에도 보송하거나 건조해요", "leaf"), option("BALANCED", "살짝 윤기가 돌아요", "이마·코에만 약간 느껴져요", "sun"), option("HIGH", "금방 번들거려요", "유분을 닦아내고 싶을 정도예요", "waves")] },
  { key: "cheekOiliness", group: "유수분 관찰", tone: "water", icon: "flower", title: "같은 시간, 양쪽 볼은 어떤가요?", hint: "이마·코와 볼의 차이를 따로 살펴볼게요.", note: "얼굴 전체가 같은 상태라고 가정하지 않아요.", options: [option("LOW", "볼은 건조해요", "유분이 적고 당기거나 거칠어요", "leaf"), option("BALANCED", "볼은 편안해요", "당김이나 번들거림이 적어요", "flower"), option("HIGH", "볼도 번들거려요", "이마·코처럼 유분이 느껴져요", "sun")] },
  { key: "hydrationLevel", group: "유수분 관찰", tone: "water", icon: "drop", title: "겉의 유분과 별개로, 속당김이 있나요?", hint: "보습제를 평소처럼 사용한 날을 떠올려주세요.", note: "번들거림과 건조한 느낌은 각각 기록해요.", options: [option("LOW", "자주 속당김이 있어요", "웃거나 표정을 지을 때도 당겨요", "wind"), option("BALANCED", "대체로 편안해요", "일상에서 당김이 크게 없어요", "drop"), option("HIGH", "촉촉함이 오래가요", "시간이 지나도 건조함이 적어요", "waves")] },
  { key: "cleansingTightness", group: "유수분 관찰", tone: "water", icon: "clock", title: "평소 세안 직후의 당김은 어떤가요?", hint: "확인을 위해 보습을 늦추지 말고, 평소 경험으로 답해요.", note: "속당김 답변으로 자동 추정하지 않고 따로 기록해요.", options: [option("NONE", "당김이 거의 없어요", "물기를 닦은 뒤에도 편안해요", "leaf"), option("SHORT", "잠깐 당겨요", "평소 보습 후에는 편안해져요", "clock"), option("LONG", "당김이 오래 남아요", "보습해도 한동안 불편해요", "wind")] },
  { key: "sensitivityLevel", group: "피부 반응", tone: "rose", icon: "shield", title: "새 제품을 쓸 때 따갑거나 불편한가요?", hint: "최근 사용 경험을 기준으로 골라주세요.", note: "민감 반응은 건성·지성 같은 유분 경향과 별도로 보여줘요.", options: [option("LOW", "반응이 드물어요", "대부분 편안하게 사용해요", "shield"), option("MEDIUM", "가끔 반응해요", "제품이나 컨디션에 따라 달라요", "flower"), option("HIGH", "쉽게 반응해요", "따가움·화끈거림이 자주 있어요", "sparkles")] },
  { key: "rednessFrequency", group: "피부 반응", tone: "rose", icon: "flower", title: "평소 붉어짐은 얼마나 자주 보이나요?", hint: "세안이나 온도 변화 뒤의 모습을 떠올려주세요.", note: "붉어짐의 원인이나 피부 질환을 판정하는 질문은 아니에요.", options: [option("RARE", "거의 없어요", "붉어짐이 크게 눈에 띄지 않아요", "leaf"), option("OCCASIONAL", "가끔 보여요", "계절·컨디션에 따라 보여요", "flower"), option("FREQUENT", "자주 보여요", "일상에서 반복적으로 보여요", "sun")] },
  { key: "breakoutFrequency", group: "피부 반응", tone: "rose", icon: "sparkles", title: "최근 한 달, 트러블은 얼마나 있었나요?", hint: "평소보다 특별히 심했던 하루보다는 반복 양상을 봐요.", note: "트러블의 종류나 치료 필요성을 진단하지 않아요.", options: [option("RARE", "거의 없었어요", "가끔 한두 개 생기는 정도예요", "leaf"), option("OCCASIONAL", "주기적으로 생겨요", "피곤할 때나 일정 시기에 보여요", "clock"), option("FREQUENT", "자주 반복돼요", "여러 날에 걸쳐 계속 신경 쓰여요", "sparkles")] },
  { key: "poreLevel", group: "피부 반응", tone: "rose", icon: "flower", title: "모공은 어느 정도 눈에 띄나요?", hint: "평소 거울로 볼 때 느끼는 정도를 골라주세요.", note: "확대 촬영이나 실제 모공 크기 측정은 하지 않아요.", options: [option("LOW", "크게 신경 쓰이지 않아요", "평소에는 잘 의식하지 않아요", "leaf"), option("MEDIUM", "일부 부위에서 보여요", "코나 볼 안쪽에 주로 보여요", "flower"), option("HIGH", "여러 부위에서 보여요", "얼굴 전반에서 도드라져 보여요", "sparkles")] },
  { key: "concerns", group: "나의 우선순위", tone: "sage", icon: "leaf", title: "가장 먼저 챙기고 싶은 고민은 무엇인가요?", hint: "1~3개를 골라 나의 우선순위를 알려주세요.", note: "선택한 고민은 피부 경향을 덮어쓰지 않아요.", multiple: true, min: 1, max: 3, options: [option("속건조·당김", "속건조·당김", "건조하고 당기는 느낌", "drop"), option("유분·번들거림", "유분·번들거림", "쉽게 올라오는 유분", "sun"), option("트러블·여드름", "트러블·여드름", "반복되는 피부 고민", "sparkles"), option("블랙헤드·모공", "블랙헤드·모공", "눈에 띄는 모공", "flower"), option("붉은기·민감", "붉은기·민감", "붉어짐과 불편함", "shield"), option("장벽·각질", "장벽·각질", "거칠고 들뜨는 피부", "leaf"), option("잡티·칙칙함", "잡티·칙칙함", "피부 톤에 대한 고민", "sun"), option("탄력·잔주름", "탄력·잔주름", "탄탄함과 잔주름 고민", "waves")] },
  { key: "texturePreference", group: "나의 우선순위", tone: "sage", icon: "drop", title: "매일 쓰고 싶은 마무리감은 어떤가요?", hint: "피부 상태가 아니라 나의 사용 취향을 고르는 질문이에요.", note: "취향을 피부 타입으로 해석하지 않아요.", options: [option("LIGHT", "가볍고 산뜻하게", "빠르게 흡수되고 잔여감이 적게", "wind"), option("BALANCED", "촉촉하고 편안하게", "수분감과 마무리감이 균형 있게", "drop"), option("RICH", "쫀쫀하고 든든하게", "보호막 같은 보습감이 남도록", "shield")] },
  { key: "routineComplexity", group: "나의 우선순위", tone: "sage", icon: "layers", title: "평소 스킨케어는 몇 단계로 하나요?", hint: "세안 뒤 사용하는 제품 개수를 생각해 주세요.", note: "현재 루틴을 기록하며 단계가 많다고 더 높은 점수를 주지 않아요.", options: [option("MINIMAL", "1~2단계", "기본 제품으로 간단하게", "leaf"), option("STANDARD", "3~4단계", "세럼·에센스 등을 함께", "layers"), option("LAYERED", "5단계 이상", "여러 제품을 나누어 사용", "sparkles")] },
  { key: "sunscreenUsage", group: "생활과 환경", tone: "lilac", icon: "sun", title: "선케어 제품은 얼마나 자주 사용하나요?", hint: "최근의 실제 사용 습관을 골라주세요.", note: "답변을 잘함·못함으로 평가하지 않아요.", options: [option("RARE", "거의 사용하지 않아요", "특별한 야외 일정이 있을 때만", "leaf"), option("SOMETIMES", "가끔 사용해요", "일정에 따라 일주일에 몇 번", "clock"), option("DAILY", "매일 사용해요", "평소 루틴에 포함되어 있어요", "sun")] },
  { key: "reactionTriggers", group: "생활과 환경", tone: "lilac", icon: "shield", title: "사용 후 불편했던 성분이 있나요?", hint: "아는 것만 선택하세요. ‘아직 모름’도 괜찮아요.", note: "불편했던 경험을 기록할 뿐, 성분 알레르기를 확정하지 않아요.", multiple: true, max: 6, exclusive: "아직 모름", options: [option("향료", "향료", "향이 있는 제품", "flower"), option("에탄올", "에탄올", "알코올 성분", "drop"), option("에센셜 오일", "에센셜 오일", "식물 유래 향 오일", "leaf"), option("각질 케어 성분", "각질 케어 성분", "산 성분 등의 사용 경험", "waves"), option("레티노이드", "레티노이드", "레티놀 등 사용 경험", "sparkles"), option("고함량 비타민C", "고함량 비타민C", "비타민C 제품 사용 경험", "sun"), option("아직 모름", "아직 모름", "어떤 성분인지 몰라요", "shield")] },
  { key: "routineContexts", group: "생활과 환경", tone: "lilac", icon: "layers", title: "피부에 반복해서 닿는 습관이 있나요?", hint: "해당하는 것을 모두 골라주세요. 선택하지 않아도 돼요.", note: "성별 대신 실제 관리 습관을 기록해요.", multiple: true, max: 6, options: [option("면도 자주", "면도 자주", "정기적으로 면도해요", "waves"), option("면도 후 붉어짐", "면도 후 붉어짐", "면도 뒤 불편함이 있어요", "flower"), option("메이크업 자주", "메이크업 자주", "베이스 제품을 자주 써요", "sparkles"), option("메이크업 밀림", "메이크업 밀림", "겹쳐 바르면 밀리는 편이에요", "layers"), option("이중 세안", "이중 세안", "두 종류로 세안해요", "drop"), option("고기능성 성분 사용", "고기능성 성분 사용", "집중 관리 제품을 써요", "shield")] },
  { key: "environments", group: "생활과 환경", tone: "lilac", icon: "wind", title: "최근 자주 겪는 환경을 알려주세요", hint: "피부 상태에 영향을 느꼈던 상황을 골라주세요. 선택 사항이에요.", note: "이번 답변을 기준으로 요약을 확인한 뒤 언제든 수정할 수 있어요.", multiple: true, max: 6, options: [option("냉난방 건조", "냉난방 건조", "실내 공기가 건조해요", "wind"), option("마스크 장시간", "마스크 장시간", "피부에 오래 닿아 있어요", "shield"), option("야외 활동", "야외 활동", "밖에서 보내는 시간이 많아요", "sun"), option("미세먼지", "미세먼지", "공기 질이 신경 쓰여요", "flower"), option("계절 변화", "계절 변화", "계절마다 피부가 달라져요", "leaf"), option("수면 부족", "수면 부족", "잠이 부족한 날이 많아요", "clock")] },
];

export function validAnswer(question: SkinQuestion, value: unknown): boolean {
  const allowed = new Set(question.options.map(o => o.value));
  if (!question.multiple) return typeof value === "string" && allowed.has(value);
  return Array.isArray(value) && value.length >= (question.min ?? 0) && value.length <= (question.max ?? question.options.length)
    && new Set(value).size === value.length && value.every(v => typeof v === "string" && allowed.has(v))
    && !(question.exclusive && value.includes(question.exclusive) && value.length > 1);
}
export function canContinue(question: SkinQuestion, answers: SkinAnswers) {
  return (question.multiple && !question.min && answers[question.key] === undefined) || validAnswer(question, answers[question.key]);
}
export function firstMissingAnswer(answers: SkinAnswers) {
  return skinQuestions.findIndex(q => !canContinue(q, answers));
}
export function chooseAnswer(answers: SkinAnswers, question: SkinQuestion, value: string): SkinAnswers {
  if (!question.options.some(o => o.value === value)) return answers;
  if (!question.multiple) return { ...answers, [question.key]: value };
  const old = Array.isArray(answers[question.key]) ? answers[question.key] as string[] : [];
  const next = old.includes(value) ? old.filter(v => v !== value) : value === question.exclusive ? [value]
    : [...old.filter(v => v !== question.exclusive), value];
  return next.length <= (question.max ?? question.options.length) ? { ...answers, [question.key]: next } : answers;
}
export function answerLabel(question: SkinQuestion, answers: SkinAnswers): string {
  const answer = answers[question.key];
  if (answer === undefined) return "아직 답하지 않았어요";
  if (Array.isArray(answer) && !answer.length) return "선택한 항목 없음";
  return question.options.filter(o => Array.isArray(answer) ? answer.includes(o.value) : answer === o.value).map(o => o.label).join(" · ");
}

export function skinTendency(answers: SkinAnswers) {
  const oil = answers.oilinessLevel, cheek = answers.cheekOiliness, hydration = answers.hydrationLevel;
  if (!["oilinessLevel", "cheekOiliness", "hydrationLevel"].every(key => validAnswer(skinQuestions.find(q => q.key === key)!, answers[key as AnswerKey]))) return null;
  // Product-selection heuristic, not a clinically validated skin diagnosis.
  const differentZones = (oil === "HIGH" && cheek !== "HIGH") || (cheek === "HIGH" && oil !== "HIGH");
  const type = differentZones ? "복합성" : oil === "HIGH" && cheek === "HIGH" ? hydration === "LOW" ? "수부지" : "지성"
    : cheek === "LOW" && (oil === "LOW" || hydration === "LOW") ? "건성" : "중성";
  const reasons = [
    `이마·코: ${answerLabel(skinQuestions[0], answers)}`,
    `양쪽 볼: ${answerLabel(skinQuestions[1], answers)}`,
    `속당김: ${answerLabel(skinQuestions[2], answers)}`,
  ];
  return { type, reasons, differentZones, sensitive: answers.sensitivityLevel === "HIGH", dryFeeling: hydration === "LOW" };
}

export function toQuickProfile(answers: SkinAnswers): QuickSkinProfile | null {
  const tendency = skinTendency(answers);
  if (!tendency || firstMissingAnswer(answers) !== -1) return null;
  const profile: Record<string, unknown> = { skinType: tendency.type };
  for (const q of skinQuestions) {
    if (q.key !== "cheekOiliness") profile[q.key] = answers[q.key] ?? [];
  }
  return profile as QuickSkinProfile;
}

export function restoreSkinDraft(raw: string | null, now = Date.now()): { answers: SkinAnswers; view: CheckView } | null {
  if (!raw || raw.length > 15000) return null;
  try {
    const draft = JSON.parse(raw);
    if (draft?.version !== 2 || !Number.isFinite(draft.updatedAt) || now - draft.updatedAt > DRAFT_MAX_AGE || draft.updatedAt > now + 60000 || !draft.answers || typeof draft.answers !== "object") return null;
    const answers: SkinAnswers = {};
    for (const q of skinQuestions) if (validAnswer(q, draft.answers[q.key])) answers[q.key] = draft.answers[q.key];
    return { answers, view: safeCheckView(draft.view, answers) };
  } catch { return null; }
}

export function restoreSkinDraftSummary(raw: string | null, now = Date.now()): { skinType: string; hasReport: boolean } | null {
  const draft = restoreSkinDraft(raw, now);
  const profile = draft ? toQuickProfile(draft.answers) : null;
  return profile ? { skinType: profile.skinType, hasReport: draft?.view === "result" } : null;
}

export function safeCheckView(value: unknown, answers: SkinAnswers): CheckView {
  if (value === "result") return firstMissingAnswer(answers) === -1 ? "result" : "review";
  if (value === "review") return "review";
  const step = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value) ? Number(value) : 1;
  const missing = firstMissingAnswer(answers);
  return Math.max(1, Math.min(Number.isSafeInteger(step) ? step : 1, skinQuestions.length, missing < 0 ? skinQuestions.length : missing + 1));
}
