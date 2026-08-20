"use client";

import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Droplets,
  Flower2,
  Gauge,
  Leaf,
  Layers,
  LoaderCircle,
  MapPin,
  PencilLine,
  Shield,
  Sparkles,
  SunMedium,
  Waves,
  Wind,
} from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import type { SkinProfile } from "@/lib/api";
import { concerns } from "@/lib/data";
import { isQuickSkinProfile, QUICK_PROFILE_STORAGE_KEY } from "@/lib/quick-profile";
import type { Ingredient } from "@/lib/types";
import { saveSkinProfileAction, type SkinProfileActionState } from "./actions";

type BalanceLevel = "LOW" | "BALANCED" | "HIGH";
type SensitivityLevel = "LOW" | "MEDIUM" | "HIGH";
type Frequency = "RARE" | "OCCASIONAL" | "FREQUENT";
type CleansingTightness = "NONE" | "SHORT" | "LONG";
type PoreLevel = "LOW" | "MEDIUM" | "HIGH";
type TexturePreference = "LIGHT" | "BALANCED" | "RICH";
type RoutineComplexity = "MINIMAL" | "STANDARD" | "LAYERED";
type SunscreenUsage = "RARE" | "SOMETIMES" | "DAILY";

type ChoiceOption<T extends string> = { value: T; label: string; text: string };

const TOTAL_STEPS = 10;
const skinTypes = [
  { name: "건성", text: "세안 후 당김이 자주 느껴져요", icon: Droplets },
  { name: "지성", text: "유분과 번들거림이 쉽게 생겨요", icon: SunMedium },
  { name: "복합성", text: "T존은 유분, 볼은 건조해요", icon: Waves },
  { name: "수부지", text: "겉은 번들거리지만 속은 당겨요", icon: Flower2 },
  { name: "중성", text: "유수분 균형이 비교적 편안해요", icon: Leaf },
  { name: "민감", text: "환경 변화와 자극에 쉽게 반응해요", icon: Shield },
];

const hydrationOptions: readonly ChoiceOption<BalanceLevel>[] = [
  { value: "LOW", label: "수분 부족", text: "세안 후 속당김이 오래가요" },
  { value: "BALANCED", label: "수분 균형", text: "대체로 편안하게 유지돼요" },
  { value: "HIGH", label: "수분 충분", text: "촉촉함이 비교적 오래가요" },
];
const oilinessOptions: readonly ChoiceOption<BalanceLevel>[] = [
  { value: "LOW", label: "유분 적음", text: "시간이 지나도 번들거림이 적어요" },
  { value: "BALANCED", label: "유분 보통", text: "오후에 살짝 유분이 느껴져요" },
  { value: "HIGH", label: "유분 많음", text: "세안 후에도 금방 번들거려요" },
];
const sensitivityOptions: readonly ChoiceOption<SensitivityLevel>[] = [
  { value: "LOW", label: "민감도 낮음", text: "새 제품에도 반응이 드문 편이에요" },
  { value: "MEDIUM", label: "민감도 보통", text: "컨디션에 따라 가끔 반응해요" },
  { value: "HIGH", label: "민감도 높음", text: "붉어짐·따가움이 쉽게 생겨요" },
];
const breakoutOptions: readonly ChoiceOption<Frequency>[] = [
  { value: "RARE", label: "거의 없음", text: "트러블이 드물게 생겨요" },
  { value: "OCCASIONAL", label: "가끔", text: "피곤하거나 주기적으로 생겨요" },
  { value: "FREQUENT", label: "자주", text: "좁쌀·염증성 트러블이 잦아요" },
];
const cleansingOptions: readonly ChoiceOption<CleansingTightness>[] = [
  { value: "NONE", label: "거의 없음", text: "세안 후에도 편안한 편이에요" },
  { value: "SHORT", label: "잠깐 당김", text: "보습제를 바르면 금방 편안해져요" },
  { value: "LONG", label: "오래 당김", text: "보습 전까지 10분 이상 당겨요" },
];
const rednessOptions: readonly ChoiceOption<Frequency>[] = [
  { value: "RARE", label: "거의 없음", text: "온도 변화에도 붉어짐이 드물어요" },
  { value: "OCCASIONAL", label: "가끔", text: "피곤하거나 계절이 바뀔 때 보여요" },
  { value: "FREQUENT", label: "자주", text: "세안·온도 변화 후 쉽게 붉어져요" },
];
const poreOptions: readonly ChoiceOption<PoreLevel>[] = [
  { value: "LOW", label: "거의 안 보임", text: "가까이 봐도 크게 신경 쓰이지 않아요" },
  { value: "MEDIUM", label: "부분적으로 보임", text: "코와 볼 안쪽에서 주로 보여요" },
  { value: "HIGH", label: "넓게 도드라짐", text: "여러 부위에서 모공이 눈에 띄어요" },
];
const textureOptions: readonly ChoiceOption<TexturePreference>[] = [
  { value: "LIGHT", label: "가볍고 산뜻하게", text: "빠르게 흡수되고 잔여감이 적은 제형" },
  { value: "BALANCED", label: "촉촉하지만 편안하게", text: "수분감과 마무리감의 균형" },
  { value: "RICH", label: "쫀쫀하고 든든하게", text: "보호막이 느껴지는 보습 제형" },
];
const routineOptions: readonly ChoiceOption<RoutineComplexity>[] = [
  { value: "MINIMAL", label: "1~2단계", text: "토너와 크림처럼 단순한 루틴" },
  { value: "STANDARD", label: "3~4단계", text: "에센스나 세럼을 한두 개 더 사용" },
  { value: "LAYERED", label: "5단계 이상", text: "기능성 제품을 여러 겹 나눠 사용" },
];
const sunscreenOptions: readonly ChoiceOption<SunscreenUsage>[] = [
  { value: "RARE", label: "거의 안 바름", text: "야외 일정이 있을 때만 사용해요" },
  { value: "SOMETIMES", label: "가끔 바름", text: "주 2~4회 정도 사용해요" },
  { value: "DAILY", label: "매일 바름", text: "계절과 관계없이 꾸준히 사용해요" },
];

const reactionTriggerOptions = ["향료", "에탄올", "에센셜 오일", "각질 케어 성분", "레티노이드", "고함량 비타민C", "아직 모름"];
const breakoutZoneOptions = ["이마", "코", "볼", "턱·입가", "얼굴 전체"];
const environmentOptions = ["냉난방 건조", "마스크 장시간", "야외 활동", "미세먼지", "계절 변화", "수면 부족"];
const routineContextOptions = ["면도 자주", "면도 후 붉어짐", "메이크업 자주", "메이크업 밀림", "이중 세안", "고기능성 성분 사용"];
const initialActionState: SkinProfileActionState = { success: false, message: "", fieldErrors: {} };

const legacyConcernLabels: Record<string, string> = {
  속건조: "속건조·당김",
  민감: "붉은기·민감",
  모공: "블랙헤드·모공",
  붉은기: "붉은기·민감",
  "피부 장벽": "장벽·각질",
  각질: "장벽·각질",
  칙칙함: "잡티·칙칙함",
  탄력: "탄력·잔주름",
};

function defaults(profile: SkinProfile | null, ingredientIds: string[]) {
  return {
    skin: profile?.skinType ?? "수부지",
    hydrationLevel: profile?.hydrationLevel ?? ("BALANCED" as BalanceLevel),
    oilinessLevel: profile?.oilinessLevel ?? ("BALANCED" as BalanceLevel),
    sensitivityLevel: profile?.sensitivityLevel ?? ("MEDIUM" as SensitivityLevel),
    breakoutFrequency: profile?.breakoutFrequency ?? ("OCCASIONAL" as Frequency),
    cleansingTightness: profile?.cleansingTightness ?? ("SHORT" as CleansingTightness),
    rednessFrequency: profile?.rednessFrequency ?? ("OCCASIONAL" as Frequency),
    poreLevel: profile?.poreLevel ?? ("MEDIUM" as PoreLevel),
    texturePreference: profile?.texturePreference ?? ("BALANCED" as TexturePreference),
    routineComplexity: profile?.routineComplexity ?? ("STANDARD" as RoutineComplexity),
    sunscreenUsage: profile?.sunscreenUsage ?? ("SOMETIMES" as SunscreenUsage),
    reactionTriggers: profile?.reactionTriggers ?? [],
    breakoutZones: profile?.breakoutZones ?? [],
    environments: profile?.environments ?? [],
    routineContexts: profile?.routineContexts ?? [],
    concerns: profile?.concerns.length
      ? [...new Set(profile.concerns.map((value) => legacyConcernLabels[value] ?? value))]
      : ["속건조·당김", "붉은기·민감", "장벽·각질"],
    ingredientIds,
    profileVersion: profile?.profileVersion ?? 0,
  };
}

export function SkinProfileForm({ nickname, initialProfile, ingredients, initialPreferredIngredientIds, importQuickProfile = false }: { nickname: string; initialProfile: SkinProfile | null; ingredients: Ingredient[]; initialPreferredIngredientIds: string[]; importQuickProfile?: boolean }) {
  const initial = defaults(initialProfile, initialPreferredIngredientIds);
  const configured = Boolean(initialProfile?.configured && initialProfile.skinType);
  const [hasProfile, setHasProfile] = useState(configured);
  const [editing, setEditing] = useState(!configured);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(initial);
  const [savedValues, setSavedValues] = useState(initial);
  const [state, formAction, pending] = useActionState(saveSkinProfileAction, initialActionState);

  useEffect(() => {
    if (!importQuickProfile) return;
    try {
      const stored = window.localStorage.getItem(QUICK_PROFILE_STORAGE_KEY);
      const quickProfile: unknown = stored ? JSON.parse(stored) : null;
      if (!isQuickSkinProfile(quickProfile)) return;
      setValues((previous) => ({
        ...previous,
        skin: quickProfile.skinType,
        hydrationLevel: quickProfile.hydrationLevel,
        oilinessLevel: quickProfile.oilinessLevel,
        sensitivityLevel: quickProfile.sensitivityLevel,
        breakoutFrequency: quickProfile.breakoutFrequency,
        cleansingTightness: quickProfile.cleansingTightness,
        rednessFrequency: quickProfile.rednessFrequency,
        poreLevel: quickProfile.poreLevel,
        texturePreference: quickProfile.texturePreference,
        routineComplexity: quickProfile.routineComplexity,
        sunscreenUsage: quickProfile.sunscreenUsage,
        concerns: quickProfile.concerns,
        reactionTriggers: quickProfile.reactionTriggers,
        environments: quickProfile.environments,
        routineContexts: quickProfile.routineContexts,
      }));
      setEditing(true);
      setStep(TOTAL_STEPS);
    } catch {
      window.localStorage.removeItem(QUICK_PROFILE_STORAGE_KEY);
    }
  }, [importQuickProfile]);

  useEffect(() => {
    if (state.success) {
      window.localStorage.removeItem(QUICK_PROFILE_STORAGE_KEY);
      const saved = { ...values, profileVersion: 2 };
      setValues(saved);
      setSavedValues(saved);
      setHasProfile(true);
      setEditing(false);
      setStep(1);
      return;
    }
    if (!state.message) return;
    const errors = state.fieldErrors;
    if (errors.skinType) setStep(1);
    else if (errors.hydrationLevel || errors.oilinessLevel) setStep(2);
    else if (errors.cleansingTightness || errors.rednessFrequency) setStep(3);
    else if (errors.breakoutFrequency || errors.poreLevel || errors.breakoutZones) setStep(4);
    else if (errors.sensitivityLevel || errors.reactionTriggers) setStep(5);
    else if (errors.routineComplexity || errors.sunscreenUsage || errors.environments || errors.routineContexts) setStep(6);
    else if (errors.texturePreference) setStep(7);
    else if (errors.concerns) setStep(8);
    else if (errors.ingredientIds) setStep(9);
  }, [state]);

  const setValue = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((previous) => ({ ...previous, [key]: value }));
  const toggleList = (key: "reactionTriggers" | "breakoutZones" | "environments" | "routineContexts" | "concerns" | "ingredientIds", value: string, max: number) => {
    setValues((previous) => {
      const selected = previous[key] as string[];
      let next = selected.includes(value) ? selected.filter((item) => item !== value) : selected.length < max ? [...selected, value] : selected;
      if (key === "reactionTriggers") {
        if (value === "아직 모름" && !selected.includes(value)) next = [value];
        else if (value !== "아직 모름") next = next.filter((item) => item !== "아직 모름");
      }
      return { ...previous, [key]: next };
    });
  };
  const moveNext = () => {
    if (step === 8 && values.concerns.length === 0) return;
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };
  const startEditing = () => { setValues(savedValues); setStep(1); setEditing(true); };
  const cancelEditing = () => { setValues(savedValues); setEditing(false); setStep(1); };

  return <div className="min-h-[calc(100vh-72px)] bg-[radial-gradient(circle_at_80%_12%,rgba(223,133,159,.22),transparent_28%),linear-gradient(145deg,#fffafd,#fae5eb)] py-8 md:min-h-[calc(100vh-74px)] md:py-14">
    <div className="container-page max-w-4xl">
      <Link href={hasProfile ? "/my" : "/"} className="mb-7 inline-flex min-h-11 items-center gap-2 text-sm text-[#76685f]"><ArrowLeft size={16} /> {hasProfile ? "마이화력으로" : "홈으로"}</Link>
      {hasProfile && !editing ? <ProfileSummary nickname={nickname} values={savedValues} ingredients={ingredients} updatedAt={state.success ? null : initialProfile?.updatedAt ?? null} savedNow={state.success} onEdit={startEditing} /> : <>
        <div className="mb-7 flex items-end justify-between gap-5">
          <div><p className="eyebrow mb-3">DEEP SKIN PROFILE</p><h1 className="font-myeongjo text-[28px] font-semibold leading-tight sm:text-3xl md:text-4xl">{hasProfile ? `${nickname}님의 피부 기준 다시 읽기` : "한 번 자세히, 오래 쓰는 피부 기준"}</h1><p className="mt-3 max-w-2xl text-xs leading-6 text-[#7d6f68]">정답을 맞히는 검사가 아니라 최근 3개월의 관찰을 남기는 과정이에요. 모르는 항목은 가장 가까운 설명을 고르세요.</p></div>
          <span className="shrink-0 font-myeongjo text-sm text-[#9a6e60]">{step} / {TOTAL_STEPS}</span>
        </div>
        <div className="mb-7 flex gap-1.5">{Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map((item) => <div key={item} className={`h-1.5 flex-1 rounded-full transition ${item <= step ? "bg-[#a54f63]" : "bg-[#efd9df]"}`} />)}</div>

        <form action={formAction} className="paper-card rounded-[26px] p-5 sm:rounded-[30px] sm:p-6 md:p-10">
          <HiddenFields values={values} />
          {step === 1 && <div><StepHeading number="01" title="평소 내 피부를 가장 잘 설명하는 것은?" description="이름보다 설명을 읽고 가장 가까운 한 가지를 골라주세요." usage="맞춤 랭킹의 큰 방향을 정해요." /><div className="grid gap-3 sm:grid-cols-2">{skinTypes.map(({ name, text, icon: Icon }) => <button type="button" key={name} onClick={() => setValue("skin", name)} aria-pressed={values.skin === name} className="glass-choice flex min-h-[84px] items-center gap-3 rounded-2xl p-4 text-left sm:gap-4"><span className="choice-icon grid h-11 w-11 shrink-0 place-items-center rounded-full"><Icon size={19} /></span><span className="min-w-0"><strong className="font-myeongjo text-lg">{name}</strong><small className="choice-copy mt-1 block text-[11px] leading-5">{text}</small></span>{values.skin === name && <Check size={17} className="ml-auto shrink-0" />}</button>)}</div><FieldError message={state.fieldErrors.skinType} /></div>}

          {step === 2 && <div><StepHeading number="02" title="세안 후 2시간, 피부는 어떻게 변하나요?" description="아무것도 바르지 않았을 때의 속당김과 겉 유분을 따로 떠올려보세요." usage="보습 가점과 유분 부담을 각각 계산해요." /><ChoiceSection title="피부 속 수분감" icon={Droplets}><OptionGrid value={values.hydrationLevel} options={hydrationOptions} onChange={(value) => setValue("hydrationLevel", value)} /></ChoiceSection><ChoiceSection title="피부 겉 유분감" icon={SunMedium}><OptionGrid value={values.oilinessLevel} options={oilinessOptions} onChange={(value) => setValue("oilinessLevel", value)} /></ChoiceSection><FieldError message={state.fieldErrors.hydrationLevel ?? state.fieldErrors.oilinessLevel} /></div>}

          {step === 3 && <div><StepHeading number="03" title="피부 장벽이 보내는 신호를 본 적 있나요?" description="세안 직후와 온도 변화 뒤의 반응을 기준으로 골라주세요." usage="보습·장벽·진정 제품의 우선순위를 조절해요." /><ChoiceSection title="세안 후 당김 지속시간" icon={Clock3}><OptionGrid value={values.cleansingTightness} options={cleansingOptions} onChange={(value) => setValue("cleansingTightness", value)} /></ChoiceSection><ChoiceSection title="붉어짐 빈도" icon={Activity}><OptionGrid value={values.rednessFrequency} options={rednessOptions} onChange={(value) => setValue("rednessFrequency", value)} /></ChoiceSection><FieldError message={state.fieldErrors.cleansingTightness ?? state.fieldErrors.rednessFrequency} /></div>}

          {step === 4 && <div><StepHeading number="04" title="모공과 트러블은 어디서, 얼마나 보이나요?" description="최근 3개월의 빈도와 주로 나타나는 위치를 함께 남겨주세요." usage="유분 부담과 트러블 주의 안내를 세밀하게 만들어요." /><ChoiceSection title="모공 체감" icon={Gauge}><OptionGrid value={values.poreLevel} options={poreOptions} onChange={(value) => setValue("poreLevel", value)} /></ChoiceSection><ChoiceSection title="트러블 빈도" icon={Activity}><OptionGrid value={values.breakoutFrequency} options={breakoutOptions} onChange={(value) => setValue("breakoutFrequency", value)} /></ChoiceSection><ChoiceSection title="주로 생기는 위치 · 선택" icon={MapPin}><MultiChoiceGrid options={breakoutZoneOptions} selected={values.breakoutZones} onToggle={(value) => toggleList("breakoutZones", value, 5)} /></ChoiceSection><FieldError message={state.fieldErrors.breakoutFrequency ?? state.fieldErrors.poreLevel ?? state.fieldErrors.breakoutZones} /></div>}

          {step === 5 && <div><StepHeading number="05" title="새 제품에 어떤 반응이 있었나요?" description="정확한 원인을 몰라도 괜찮아요. 기억나는 반응 이력을 남겨주세요." usage="전성분 확인과 작은 부위 시험이 필요한 상황을 먼저 알려줘요." /><ChoiceSection title="피부 민감도" icon={Shield}><OptionGrid value={values.sensitivityLevel} options={sensitivityOptions} onChange={(value) => setValue("sensitivityLevel", value)} /></ChoiceSection><ChoiceSection title={`의심되는 반응 요인 · 선택 ${values.reactionTriggers.length}/6`} icon={Sparkles}><MultiChoiceGrid options={reactionTriggerOptions} selected={values.reactionTriggers} onToggle={(value) => toggleList("reactionTriggers", value, 6)} /></ChoiceSection><FieldError message={state.fieldErrors.sensitivityLevel ?? state.fieldErrors.reactionTriggers} /></div>}

          {step === 6 && <div><StepHeading number="06" title="피부가 하루를 보내는 환경은 어떤가요?" description="성별 대신 면도·메이크업·세안처럼 실제 피부에 닿는 습관을 물어요." usage="생활 환경과 반복되는 자극을 추천 순서에 반영해요." /><ChoiceSection title="평소 스킨케어 단계" icon={Layers}><OptionGrid value={values.routineComplexity} options={routineOptions} onChange={(value) => setValue("routineComplexity", value)} /></ChoiceSection><ChoiceSection title="자외선 차단 습관" icon={SunMedium}><OptionGrid value={values.sunscreenUsage} options={sunscreenOptions} onChange={(value) => setValue("sunscreenUsage", value)} /></ChoiceSection><ChoiceSection title={`자주 겪는 환경 · 선택 ${values.environments.length}/6`} icon={Wind}><MultiChoiceGrid options={environmentOptions} selected={values.environments} onToggle={(value) => toggleList("environments", value, 6)} /></ChoiceSection><ChoiceSection title={`피부에 영향을 주는 생활 습관 · 선택 ${values.routineContexts.length}/6`} icon={Sparkles}><MultiChoiceGrid options={routineContextOptions} selected={values.routineContexts} onToggle={(value) => toggleList("routineContexts", value, 6)} /></ChoiceSection><FieldError message={state.fieldErrors.routineComplexity ?? state.fieldErrors.sunscreenUsage ?? state.fieldErrors.environments ?? state.fieldErrors.routineContexts} /></div>}

          {step === 7 && <div><StepHeading number="07" title="매일 손이 가는 사용감은 어느 쪽인가요?" description="좋은 성분도 손이 가지 않으면 꾸준히 쓰기 어려워요." usage="토너·세럼·젤·크림의 추천 순서를 현실적으로 조정해요." /><OptionGrid value={values.texturePreference} options={textureOptions} onChange={(value) => setValue("texturePreference", value)} /><FieldError message={state.fieldErrors.texturePreference} /></div>}

          {step === 8 && <div><StepHeading number="08" title="지금 가장 먼저 바꾸고 싶은 것은?" description={<>1개 이상, 최대 4개까지 우선순위 순으로 골라주세요. <span className="font-semibold text-[#a54f49]">{values.concerns.length}/4</span></>} usage="제품 효능과 피부 목표가 만나는 지점을 점수에 반영해요." /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{concerns.map((concern) => { const active = values.concerns.includes(concern); return <button type="button" key={concern} onClick={() => toggleList("concerns", concern, 4)} aria-pressed={active} className="glass-choice relative min-h-24 rounded-2xl p-4 font-myeongjo text-[17px]">{active && <Check size={15} className="absolute right-3 top-3" />}<span className="mb-2 block text-2xl text-white/70">{active ? "✿" : "❀"}</span>{concern}</button>; })}</div><FieldError message={state.fieldErrors.concerns ?? (values.concerns.length === 0 ? "피부 고민을 하나 이상 선택해 주세요." : undefined)} /></div>}

          {step === 9 && <div><StepHeading number="09" title="이미 잘 맞았던 성분이 있나요?" description={<>선택 사항이에요. 모르겠다면 건너뛰고, 기억나는 성분은 최대 10개까지 순서대로 골라주세요. <span className="font-semibold text-[#a54f49]">{values.ingredientIds.length}/10</span></>} usage="성분 화력과 제품 상세의 우선 근거로 연결해요." /><div className="grid gap-2.5 sm:grid-cols-2">{ingredients.map((ingredient) => { const active = values.ingredientIds.includes(ingredient.id); const priority = values.ingredientIds.indexOf(ingredient.id) + 1; return <button type="button" key={ingredient.id} onClick={() => toggleList("ingredientIds", ingredient.id, 10)} aria-pressed={active} disabled={!active && values.ingredientIds.length >= 10} className="glass-choice flex min-h-[78px] items-center gap-3 rounded-2xl p-4 text-left disabled:cursor-not-allowed disabled:opacity-45"><span className="choice-icon grid h-10 w-10 shrink-0 place-items-center rounded-full font-myeongjo text-sm">{active ? priority : "成"}</span><span className="min-w-0 flex-1"><strong className="block font-myeongjo text-base">{ingredient.name}</strong><small className="choice-copy mt-1 block text-[11px]">근거 {ingredient.evidenceLevel} · {ingredient.role}</small></span>{active && <Check size={17} className="shrink-0" />}</button>; })}</div><FieldError message={state.fieldErrors.ingredientIds} /></div>}

          {step === 10 && <Review values={values} ingredients={ingredients} state={state} />}
          <div className="profile-form-actions mt-9 flex justify-between gap-3 border-t border-[#76564316] pt-6">
            {step === 1 && hasProfile ? <button type="button" onClick={cancelEditing} disabled={pending} className="line-btn">수정 취소</button> : <button type="button" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || pending} className="line-btn disabled:invisible"><ArrowLeft size={16} /> 이전</button>}
            {step < TOTAL_STEPS ? <button type="button" onClick={moveNext} disabled={step === 8 && values.concerns.length === 0} className="ink-btn ml-auto disabled:cursor-not-allowed disabled:opacity-50">{step === 9 && values.ingredientIds.length === 0 ? "건너뛰고 확인" : "다음"} <ArrowRight size={16} /></button> : <button type="submit" disabled={pending} className="ink-btn ml-auto disabled:cursor-wait disabled:opacity-65">{pending ? <><LoaderCircle size={16} className="animate-spin" /> 저장하고 있어요</> : <><Sparkles size={16} /> 이 기준으로 저장</>}</button>}
          </div>
        </form>
      </>}
    </div>
  </div>;
}

function HiddenFields({ values }: { values: ReturnType<typeof defaults> }) {
  return <><input type="hidden" name="skinType" value={values.skin} /><input type="hidden" name="hydrationLevel" value={values.hydrationLevel} /><input type="hidden" name="oilinessLevel" value={values.oilinessLevel} /><input type="hidden" name="sensitivityLevel" value={values.sensitivityLevel} /><input type="hidden" name="breakoutFrequency" value={values.breakoutFrequency} /><input type="hidden" name="cleansingTightness" value={values.cleansingTightness} /><input type="hidden" name="rednessFrequency" value={values.rednessFrequency} /><input type="hidden" name="poreLevel" value={values.poreLevel} /><input type="hidden" name="texturePreference" value={values.texturePreference} /><input type="hidden" name="routineComplexity" value={values.routineComplexity} /><input type="hidden" name="sunscreenUsage" value={values.sunscreenUsage} />{values.reactionTriggers.map((value) => <input key={value} type="hidden" name="reactionTriggers" value={value} />)}{values.breakoutZones.map((value) => <input key={value} type="hidden" name="breakoutZones" value={value} />)}{values.environments.map((value) => <input key={value} type="hidden" name="environments" value={value} />)}{values.routineContexts.map((value) => <input key={value} type="hidden" name="routineContexts" value={value} />)}{values.concerns.map((value) => <input key={value} type="hidden" name="concerns" value={value} />)}{values.ingredientIds.map((value) => <input key={value} type="hidden" name="ingredientIds" value={value} />)}</>;
}

function Review({ values, ingredients, state }: { values: ReturnType<typeof defaults>; ingredients: Ingredient[]; state: SkinProfileActionState }) {
  return <div><div className="text-center"><span className="seal mx-auto h-14 w-14 font-myeongjo text-2xl">完</span><h2 className="mt-5 font-myeongjo text-2xl font-semibold">오래 쓸 피부 기준을 확인해 주세요</h2><p className="mt-2 text-sm leading-6 text-[#7e7168]">이 정보는 점수, 랭킹, 사용 팁과 주의 안내에 나누어 사용돼요.</p></div><ProfileDetails values={values} /><div className="glass-panel mt-4 rounded-2xl p-5 sm:p-6"><SummaryRows values={values} ingredients={ingredients} /></div><UsagePanel />{state.message && !state.success && <div className="mt-5 rounded-2xl border border-[#b56b5725] bg-[#fff3ed] px-4 py-3 text-sm text-[#934d43]" role="alert" aria-live="polite">{state.message}</div>}</div>;
}

function ProfileSummary({ nickname, values, ingredients, updatedAt, savedNow, onEdit }: { nickname: string; values: ReturnType<typeof defaults>; ingredients: Ingredient[]; updatedAt: string | null; savedNow: boolean; onEdit: () => void }) {
  const legacy = values.profileVersion < 2;
  return <><div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow mb-3">MY DEEP SKIN PROFILE</p><h1 className="font-myeongjo text-[32px] font-semibold leading-tight sm:text-4xl">{nickname}님의 피부 기준</h1><p className="mt-3 text-sm text-[#786b63]">한 번 저장한 관찰 정보가 화력 분석과 추천의 공통 기준으로 쓰여요.</p></div><button type="button" onClick={onEdit} className="line-btn w-full sm:w-auto"><PencilLine size={16} /> {legacy ? "세부 정보 보완" : "프로필 수정"}</button></div>{legacy && <div className="mb-5 rounded-2xl border border-[#b78a4b35] bg-[#fff8e9] px-4 py-4 text-sm leading-6 text-[#79613d]">기존 피부 정보는 그대로 보존했어요. 새 관찰 문항을 한 번 보완하면 더 많은 화면에서 정밀하게 사용할 수 있어요.</div>}{savedNow && <div className="mb-5 rounded-2xl border border-[#71806b30] bg-[#eef3e9] px-4 py-3 text-sm text-[#5f705a]" role="status">세부 피부 기준을 저장했어요. 제품 화력과 추천 순위를 새 기준으로 보여드려요.</div>}<section className="paper-card overflow-hidden rounded-[28px] sm:rounded-[32px]"><div className="bg-[#fff1f4] p-6 sm:p-8"><div className="flex items-center gap-5"><span className="seal h-16 w-16 shrink-0 font-myeongjo text-2xl">{skinSeal(values.skin)}</span><div><p className="text-xs font-bold tracking-[.12em] text-[#9d5a68]">나의 기본 피부</p><h2 className="mt-2 font-myeongjo text-3xl font-semibold">{values.skin} 피부</h2></div></div></div><div className="p-5 sm:p-8"><ProfileDetails values={values} /><div className="mt-6 border-t border-[#76564318] pt-6"><SummaryRows values={values} ingredients={ingredients} /></div><p className="mt-6 text-[11px] text-[#93847a]">{savedNow ? "방금 저장됨" : updatedAt ? `${formatProfileDate(updatedAt)}에 마지막으로 수정` : "저장된 프로필"}</p></div></section><UsagePanel /><div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href="/products" className="ink-btn w-full">내 피부 맞춤 제품 보기 <ArrowRight size={16} /></Link><Link href="/ranking" className="line-btn w-full">나의 화력 랭킹 보기</Link></div></>;
}

function ProfileDetails({ values }: { values: ReturnType<typeof defaults> }) {
  const details = [
    { icon: Droplets, label: "수분", value: findLabel(hydrationOptions, values.hydrationLevel) },
    { icon: SunMedium, label: "유분", value: findLabel(oilinessOptions, values.oilinessLevel) },
    { icon: Shield, label: "민감도", value: findLabel(sensitivityOptions, values.sensitivityLevel) },
    { icon: Activity, label: "트러블", value: findLabel(breakoutOptions, values.breakoutFrequency) },
    { icon: Clock3, label: "세안 후", value: findLabel(cleansingOptions, values.cleansingTightness) },
    { icon: Activity, label: "붉어짐", value: findLabel(rednessOptions, values.rednessFrequency) },
    { icon: Gauge, label: "모공", value: findLabel(poreOptions, values.poreLevel) },
    { icon: Flower2, label: "선호 제형", value: findLabel(textureOptions, values.texturePreference) },
    { icon: Layers, label: "루틴", value: findLabel(routineOptions, values.routineComplexity) },
    { icon: SunMedium, label: "선케어", value: findLabel(sunscreenOptions, values.sunscreenUsage) },
  ];
  return <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">{details.map(({ icon: Icon, label, value }) => <div key={label} className="min-w-0 rounded-2xl border border-[#74513f17] bg-white/65 p-3.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e7c4b92b] text-[#9c514a]"><Icon size={15} /></span><p className="mt-3 text-[10px] text-[#897970]">{label}</p><strong className="mt-1 block truncate font-myeongjo text-sm text-[#493d36]">{value}</strong></div>)}</div>;
}

function SummaryRows({ values, ingredients }: { values: ReturnType<typeof defaults>; ingredients: Ingredient[] }) {
  return <div className="grid gap-5"><TagRow label="주요 피부 고민" values={values.concerns} /><TagRow label="트러블 위치" values={values.breakoutZones} empty="선택하지 않음" /><TagRow label="반응 유발 요인" values={values.reactionTriggers} empty="선택하지 않음" /><TagRow label="생활 환경" values={values.environments} empty="선택하지 않음" /><TagRow label="생활 습관" values={values.routineContexts} empty="선택하지 않음" /><div><p className="text-xs font-bold tracking-[.1em] text-[#8e7468]">나와 잘 맞는 성분 · 선택</p><IngredientTags ingredients={ingredients} selectedIngredientIds={values.ingredientIds} /></div></div>;
}

function UsagePanel() {
  const usages = ["제품 화력: 수분·유분·민감·장벽 신호", "맞춤 랭킹: 피부 목표·선호 제형", "사용 안내: 루틴 단계·생활 환경", "주의 안내: 반응 이력·트러블 패턴"];
  return <section className="mt-5 rounded-[24px] border border-[#8a7b9a24] bg-white/55 p-5 sm:p-6"><div className="flex items-center gap-2"><Sparkles size={17} className="text-[#a45166]" /><h3 className="font-myeongjo text-lg font-semibold">저장한 정보는 이렇게 다시 쓰여요</h3></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{usages.map((usage) => <div key={usage} className="rounded-xl bg-[#fff1f4] px-3 py-3 text-xs leading-5 text-[#705f66]">{usage}</div>)}</div><p className="mt-4 text-[11px] leading-5 text-[#93847a]">화력은 화장품 선택을 돕는 참고 정보이며 피부 질환의 진단이나 치료 판단을 대신하지 않아요.</p></section>;
}

function TagRow({ label, values, empty = "선택 없음" }: { label: string; values: string[]; empty?: string }) {
  return <div><p className="text-xs font-bold tracking-[.1em] text-[#8e7468]">{label}</p>{values.length ? <div className="mt-2 flex flex-wrap gap-2">{values.map((value) => <span key={value} className="rounded-full border border-[#a54f4920] bg-[#fff1f4] px-3 py-2 text-xs font-semibold text-[#8e4b56]">{value}</span>)}</div> : <p className="mt-2 text-xs text-[#95857c]">{empty}</p>}</div>;
}

function IngredientTags({ ingredients, selectedIngredientIds }: { ingredients: Ingredient[]; selectedIngredientIds: string[] }) {
  const selected = selectedIngredientIds.flatMap((id) => { const ingredient = ingredients.find((item) => item.id === id); return ingredient ? [ingredient] : []; });
  if (!selected.length) return <p className="mt-2 text-xs text-[#95857c]">아직 선택한 성분이 없어요.</p>;
  return <div className="mt-2 flex flex-wrap gap-2">{selected.map((ingredient, index) => <Link key={ingredient.id} href={`/ingredients/${ingredient.id}`} className="rounded-full border border-[#a54f4920] bg-[#fff1f4] px-3 py-2 text-xs font-semibold text-[#8e4b56]">{index + 1}. {ingredient.name}</Link>)}</div>;
}

function StepHeading({ number, title, description, usage }: { number: string; title: string; description: React.ReactNode; usage: string }) {
  return <div className="mb-7"><span className="text-xs font-bold text-[#a54f49]">STEP {number}</span><h2 className="mt-2 font-myeongjo text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#7e7168]">{description}</p><p className="mt-3 inline-flex rounded-full border border-[#9b6c7a20] bg-[#fff1f4] px-3 py-2 text-[11px] font-semibold text-[#8e5967]">저장 후 사용 · {usage}</p></div>;
}
function ChoiceSection({ title, icon: Icon, children }: { title: string; icon: typeof Gauge; children: React.ReactNode }) { return <section className="mb-7 last:mb-0"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#655a53]"><Icon size={17} className="text-[#a45161]" />{title}</div>{children}</section>; }
function OptionGrid<T extends string>({ value, options, onChange }: { value: T; options: readonly ChoiceOption<T>[]; onChange: (value: T) => void }) { return <div className="grid gap-2.5 sm:grid-cols-3">{options.map((option) => <button key={option.value} type="button" onClick={() => onChange(option.value)} aria-pressed={value === option.value} className="glass-choice min-h-[88px] rounded-2xl p-4 text-left"><span className="flex items-center justify-between gap-2"><strong className="font-myeongjo text-base">{option.label}</strong>{value === option.value && <Check size={16} />}</span><small className="choice-copy mt-2 block text-[11px] leading-5">{option.text}</small></button>)}</div>; }
function MultiChoiceGrid({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (value: string) => void }) { return <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">{options.map((option) => <button key={option} type="button" onClick={() => onToggle(option)} aria-pressed={selected.includes(option)} className="glass-choice flex min-h-14 items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left text-sm font-semibold"><span>{option}</span>{selected.includes(option) && <Check size={16} className="shrink-0" />}</button>)}</div>; }
function FieldError({ message }: { message?: string }) { return message ? <p className="mt-4 text-xs text-[#a64e47]" role="alert">{message}</p> : null; }
function findLabel<T extends string>(options: readonly { value: T; label: string }[], value: T) { return options.find((option) => option.value === value)?.label ?? value; }
function skinSeal(skin: string) { return ({ 건성: "乾", 지성: "油", 복합성: "複", 수부지: "水", 중성: "中", 민감: "敏" } as Record<string, string>)[skin] ?? "花"; }
function formatProfileDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value)); }
