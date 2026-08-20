"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Droplets, Leaf, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { ProductVisual } from "@/components/product-ui";
import { concerns as concernOptions } from "@/lib/data";
import { QUICK_PROFILE_STORAGE_KEY, type QuickSkinProfile } from "@/lib/quick-profile";
import { getQuickRecommendations, type QuickRecommendationResult } from "./actions";

const TOTAL_STEPS = 6;
const skinTypes = [
  ["건성", "세안 뒤 당김이 오래가요"],
  ["지성", "오후에 유분과 번들거림이 많아요"],
  ["복합성", "T존은 번들거리고 볼은 건조해요"],
  ["수부지", "겉은 번들거리지만 속은 당겨요"],
  ["중성", "유수분 균형이 비교적 편안해요"],
  ["민감", "온도나 새 제품에 쉽게 반응해요"],
] as const;

const balanceOptions = [
  { label: "당기고 건조해요", hydration: "LOW", oil: "LOW" },
  { label: "속은 당기고 겉은 번들거려요", hydration: "LOW", oil: "HIGH" },
  { label: "대체로 균형이 편안해요", hydration: "BALANCED", oil: "BALANCED" },
  { label: "유분이 빠르게 올라와요", hydration: "BALANCED", oil: "HIGH" },
] as const;

const sensitivityOptions = [
  ["LOW", "새 제품에도 반응이 드물어요"],
  ["MEDIUM", "컨디션에 따라 가끔 붉어져요"],
  ["HIGH", "따가움·붉어짐이 쉽게 생겨요"],
] as const;
const breakoutOptions = [
  ["RARE", "트러블이 거의 없어요"],
  ["OCCASIONAL", "피곤할 때 가끔 생겨요"],
  ["FREQUENT", "좁쌀이나 염증이 자주 생겨요"],
] as const;
const textureOptions = [
  ["LIGHT", "가볍고 산뜻하게"],
  ["BALANCED", "촉촉하지만 편안하게"],
  ["RICH", "쫀쫀하고 든든하게"],
] as const;
const routineOptions = [
  ["MINIMAL", "1~2단계로 간단하게"],
  ["STANDARD", "3~4단계로 균형 있게"],
  ["LAYERED", "기능성 제품을 여러 겹"],
] as const;
const triggerOptions = ["향료", "에탄올", "에센셜 오일", "각질 케어 성분", "아직 모름"];
const contextOptions = ["면도 자주", "면도 후 붉어짐", "메이크업 자주", "메이크업 밀림", "이중 세안", "고기능성 성분 사용"];

const initialProfile: QuickSkinProfile = {
  skinType: "수부지",
  hydrationLevel: "LOW",
  oilinessLevel: "HIGH",
  sensitivityLevel: "MEDIUM",
  breakoutFrequency: "OCCASIONAL",
  cleansingTightness: "SHORT",
  rednessFrequency: "OCCASIONAL",
  poreLevel: "MEDIUM",
  texturePreference: "BALANCED",
  routineComplexity: "STANDARD",
  sunscreenUsage: "SOMETIMES",
  concerns: ["속건조·당김"],
  reactionTriggers: [],
  environments: [],
  routineContexts: [],
};

export function QuickSkinCheck({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(initialProfile);
  const [result, setResult] = useState<QuickRecommendationResult | null>(null);
  const [pending, startTransition] = useTransition();

  const setValue = <K extends keyof QuickSkinProfile>(key: K, value: QuickSkinProfile[K]) => {
    setProfile((previous) => ({ ...previous, [key]: value }));
  };
  const toggle = (key: "concerns" | "reactionTriggers" | "routineContexts", value: string, max: number) => {
    setProfile((previous) => {
      const selected = previous[key];
      let next = selected.includes(value) ? selected.filter((item) => item !== value) : selected.length < max ? [...selected, value] : selected;
      if (key === "reactionTriggers") {
        if (value === "아직 모름" && !selected.includes(value)) next = [value];
        else if (value !== "아직 모름") next = next.filter((item) => item !== "아직 모름");
      }
      return { ...previous, [key]: next };
    });
  };
  const next = () => {
    if (step === 4 && profile.concerns.length === 0) return;
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };
  const calculate = () => {
    const enriched = {
      ...profile,
      cleansingTightness: profile.hydrationLevel === "LOW" ? "LONG" as const : "SHORT" as const,
      rednessFrequency: profile.sensitivityLevel === "HIGH" ? "FREQUENT" as const : "OCCASIONAL" as const,
      poreLevel: profile.concerns.includes("블랙헤드·모공") ? "HIGH" as const : "MEDIUM" as const,
    };
    setProfile(enriched);
    window.localStorage.setItem(QUICK_PROFILE_STORAGE_KEY, JSON.stringify(enriched));
    startTransition(async () => setResult(await getQuickRecommendations(enriched)));
  };

  if (result?.success) {
    const continueHref = isAuthenticated
      ? "/profile?from=quick"
      : `/login?returnTo=${encodeURIComponent("/profile?from=quick")}`;
    return <main className="min-h-[calc(100vh-72px)] bg-[radial-gradient(circle_at_85%_8%,rgba(225,132,158,.2),transparent_28%),linear-gradient(145deg,#fffafd,#fae8ed)] py-8 md:py-14">
      <div className="container-page max-w-5xl">
        <button type="button" onClick={() => { setResult(null); setStep(1); }} className="mb-7 inline-flex min-h-11 items-center gap-2 text-sm text-[#76685f]"><ArrowLeft size={16} /> 다시 체크하기</button>
        <div className="text-center"><span className="inline-flex items-center gap-2 rounded-full bg-[#fff1f4] px-4 py-2 text-xs font-bold text-[#9b4b60]"><Sparkles size={14} /> 내 피부 기준 계산 완료</span><h1 className="mt-5 font-myeongjo text-3xl font-semibold sm:text-4xl">지금 살펴볼 제품 세 가지</h1><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#74675f]">브랜드 크기나 인기보다 연결된 성분, 근거 수준, 선택한 피부 신호를 먼저 봤어요.</p></div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">{result.products.map((product, index) => <article key={product.id} className="paper-card overflow-hidden rounded-[26px]"><Link href={`/products/${product.id}`}><div className="relative"><ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} compact /><span className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[#9b4b60] font-myeongjo text-white">{index + 1}</span></div><div className="p-5"><p className="text-[10px] font-bold tracking-[.14em] text-[#88746a]">{product.brand}</p><h2 className="mt-1 font-myeongjo text-lg font-semibold">{product.name}</h2><div className="mt-4 flex items-end justify-between"><span className="text-xs text-[#817168]">내 피부 적합도</span><strong className="font-myeongjo text-3xl text-[#9b4a45]">{product.score}</strong></div><p className="mt-4 min-h-12 border-t border-[#76564318] pt-4 text-xs leading-6 text-[#6f625a]">{product.matchReasons?.[0] ?? "성분 구성을 중심으로 계산했어요."}</p><span className="mt-3 inline-flex rounded-full bg-[#eef3e9] px-2.5 py-1 text-[10px] font-bold text-[#63705e]">근거 신뢰 {confidenceLabel(product.confidenceLevel)}</span></div></Link></article>)}</div>
        <div className="mt-7 rounded-[24px] border border-[#e1a5b333] bg-white/65 p-5 sm:flex sm:items-center sm:justify-between sm:p-7"><div><strong className="font-myeongjo text-xl">이 결과를 내 피부 기준으로 이어갈까요?</strong><p className="mt-2 text-xs leading-6 text-[#7c6e66]">상세 프로필에서 확인한 뒤 저장하면 제품 목록·랭킹·분석에 같은 기준이 적용돼요.</p></div><Link href={continueHref} className="ink-btn mt-5 w-full sm:mt-0 sm:w-auto">{isAuthenticated ? "확인하고 저장" : "로그인하고 저장"} <ArrowRight size={16} /></Link></div>
        <p className="mt-5 text-center text-[11px] text-[#8c7d74]">성분 55% · 피부 적합 35% · 데이터 신뢰 10% · 광고·판매량·브랜드 인지도 미반영</p>
      </div>
    </main>;
  }

  return <main className="min-h-[calc(100vh-72px)] bg-[radial-gradient(circle_at_85%_8%,rgba(225,132,158,.2),transparent_28%),linear-gradient(145deg,#fffafd,#fae8ed)] py-8 md:py-14">
    <div className="container-page max-w-3xl">
      <Link href="/" className="mb-7 inline-flex min-h-11 items-center gap-2 text-sm text-[#76685f]"><ArrowLeft size={16} /> 홈으로</Link>
      <div className="mb-7 flex items-end justify-between gap-4"><div><p className="eyebrow mb-3">1 MINUTE SKIN CHECK</p><h1 className="font-myeongjo text-3xl font-semibold sm:text-4xl">내 피부에 뭐가 맞을까?</h1><p className="mt-3 text-sm leading-6 text-[#786b63]">로그인 없이 최근 피부 상태만 골라보세요. 성별보다 실제 피부 신호와 생활 습관을 봐요.</p></div><span className="shrink-0 font-myeongjo text-sm text-[#9a6e60]">{step} / {TOTAL_STEPS}</span></div>
      <div className="mb-7 flex gap-1.5">{Array.from({ length: TOTAL_STEPS }, (_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index < step ? "bg-[#a54f63]" : "bg-[#efd9df]"}`} />)}</div>
      <section className="paper-card rounded-[28px] p-5 sm:p-8">
        {step === 1 && <Step title="세안하고 몇 시간 뒤, 피부는 어떤가요?" description="가장 자주 느끼는 상태를 골라주세요."><ChoiceGrid>{skinTypes.map(([name, text]) => <Choice key={name} active={profile.skinType === name} onClick={() => setValue("skinType", name)} title={name} text={text} />)}</ChoiceGrid></Step>}
        {step === 2 && <Step title="당김과 번들거림은 어느 쪽인가요?" description="수분과 유분을 따로 계산하는 데 사용해요."><div className="grid gap-2.5 sm:grid-cols-2">{balanceOptions.map((option) => <Choice key={option.label} active={profile.hydrationLevel === option.hydration && profile.oilinessLevel === option.oil} onClick={() => setProfile((previous) => ({ ...previous, hydrationLevel: option.hydration, oilinessLevel: option.oil }))} title={option.label} />)}</div></Step>}
        {step === 3 && <Step title="자극과 트러블은 얼마나 자주 생기나요?" description="주의 성분과 진정 성분의 가중치를 정해요."><SubTitle icon={ShieldCheck} text="붉어짐·따가움" /><ChoiceGrid>{sensitivityOptions.map(([value, label]) => <Choice key={value} active={profile.sensitivityLevel === value} onClick={() => setValue("sensitivityLevel", value)} title={label} />)}</ChoiceGrid><SubTitle icon={CircleAlert} text="트러블 빈도" /><ChoiceGrid>{breakoutOptions.map(([value, label]) => <Choice key={value} active={profile.breakoutFrequency === value} onClick={() => setValue("breakoutFrequency", value)} title={label} />)}</ChoiceGrid></Step>}
        {step === 4 && <Step title="지금 가장 먼저 바꾸고 싶은 것은?" description={`최대 3개까지 골라주세요. ${profile.concerns.length}/3`}><div className="grid grid-cols-2 gap-2.5">{concernOptions.map((concern) => <Choice key={concern} active={profile.concerns.includes(concern)} onClick={() => toggle("concerns", concern, 3)} title={concern} />)}</div>{profile.concerns.length === 0 && <p className="mt-4 text-xs text-[#a64e47]">한 가지 이상 선택해 주세요.</p>}</Step>}
        {step === 5 && <Step title="매일 손이 가는 사용감은 어느 쪽인가요?" description="좋은 성분도 꾸준히 쓸 수 있어야 하니까요."><SubTitle icon={Droplets} text="선호 제형" /><ChoiceGrid>{textureOptions.map(([value, label]) => <Choice key={value} active={profile.texturePreference === value} onClick={() => setValue("texturePreference", value)} title={label} />)}</ChoiceGrid><SubTitle icon={Leaf} text="평소 단계" /><ChoiceGrid>{routineOptions.map(([value, label]) => <Choice key={value} active={profile.routineComplexity === value} onClick={() => setValue("routineComplexity", value)} title={label} />)}</ChoiceGrid></Step>}
        {step === 6 && <Step title="피부에 반복해서 닿는 습관이 있나요?" description="성별 대신 면도·메이크업·세안처럼 실제 자극을 선택해요. 모두 선택 사항이에요."><SubTitle icon={CircleAlert} text="반응이 의심되는 성분" /><TagChoices options={triggerOptions} selected={profile.reactionTriggers} onToggle={(value) => toggle("reactionTriggers", value, 5)} /><SubTitle icon={Sparkles} text="생활 습관" /><TagChoices options={contextOptions} selected={profile.routineContexts} onToggle={(value) => toggle("routineContexts", value, 6)} /></Step>}
        <div className="mt-8 flex justify-between gap-3 border-t border-[#76564316] pt-6"><button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1 || pending} className="line-btn disabled:invisible"><ArrowLeft size={16} /> 이전</button>{step < TOTAL_STEPS ? <button type="button" onClick={next} disabled={step === 4 && profile.concerns.length === 0} className="ink-btn ml-auto disabled:opacity-50">다음 <ArrowRight size={16} /></button> : <button type="button" onClick={calculate} disabled={pending} className="ink-btn ml-auto disabled:opacity-60">{pending ? <><LoaderCircle size={16} className="animate-spin" /> 계산 중</> : <><Sparkles size={16} /> 내 추천 보기</>}</button>}</div>
        {result && !result.success && <p role="alert" className="mt-4 rounded-xl bg-[#fff0ed] px-4 py-3 text-xs text-[#994a43]">{result.message}</p>}
      </section>
      <p className="mt-5 text-center text-[11px] leading-5 text-[#8c7d74]">의료 진단이 아닌 제품 선택을 위한 참고 정보예요. 광고비와 판매량은 추천 점수에 넣지 않아요.</p>
    </div>
  </main>;
}

function Step({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div><h2 className="font-myeongjo text-2xl font-semibold">{title}</h2><p className="mt-2 mb-7 text-sm leading-6 text-[#7e7168]">{description}</p>{children}</div>; }
function ChoiceGrid({ children }: { children: React.ReactNode }) { return <div className="grid gap-2.5 sm:grid-cols-3">{children}</div>; }
function Choice({ active, onClick, title, text }: { active: boolean; onClick: () => void; title: string; text?: string }) { return <button type="button" aria-pressed={active} onClick={onClick} className="glass-choice min-h-16 rounded-2xl p-4 text-left"><span className="flex items-center justify-between gap-2"><strong className="font-myeongjo text-[15px]">{title}</strong>{active && <Check size={15} />}</span>{text && <small className="choice-copy mt-2 block text-[11px] leading-5">{text}</small>}</button>; }
function SubTitle({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) { return <h3 className="mb-3 mt-7 first:mt-0 flex items-center gap-2 text-sm font-semibold text-[#655a53]"><Icon size={16} className="text-[#a45161]" />{text}</h3>; }
function TagChoices({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (value: string) => void }) { return <div className="flex flex-wrap gap-2">{options.map((option) => <button type="button" key={option} aria-pressed={selected.includes(option)} onClick={() => onToggle(option)} className="glass-choice rounded-full px-3.5 py-2.5 text-xs">{selected.includes(option) && <Check size={13} className="mr-1 inline" />}{option}</button>)}</div>; }
function confidenceLabel(value?: string) { return value === "HIGH" ? "높음" : value === "MEDIUM" ? "보통" : "자료 보강 중"; }
