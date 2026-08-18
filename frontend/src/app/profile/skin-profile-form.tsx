"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Droplets, Flower2, Leaf, LoaderCircle, Shield, Sparkles, SunMedium, Waves } from "lucide-react";
import { useActionState, useState } from "react";
import type { SkinProfile } from "@/lib/api";
import { concerns } from "@/lib/data";
import { saveSkinProfileAction, type SkinProfileActionState } from "./actions";

const skinTypes = [
  { name: "건성", text: "세안 후 당김이 자주 느껴져요", icon: Droplets },
  { name: "지성", text: "유분과 번들거림이 쉽게 생겨요", icon: SunMedium },
  { name: "복합성", text: "T존은 유분, 볼은 건조해요", icon: Waves },
  { name: "수부지", text: "겉은 번들거리지만 속은 당겨요", icon: Flower2 },
  { name: "중성", text: "유수분 균형이 비교적 편안해요", icon: Leaf },
  { name: "민감", text: "환경 변화와 자극에 쉽게 반응해요", icon: Shield },
];

const initialActionState: SkinProfileActionState = { success: false, message: "", fieldErrors: {} };

export function SkinProfileForm({ nickname, initialProfile }: { nickname: string; initialProfile: SkinProfile | null }) {
  const configured = Boolean(initialProfile?.configured && initialProfile.skinType);
  const [step, setStep] = useState(1);
  const [skin, setSkin] = useState(initialProfile?.skinType ?? "수부지");
  const [selectedConcerns, setSelectedConcerns] = useState(
    initialProfile?.concerns.length ? initialProfile.concerns : ["속건조", "민감", "피부 장벽"],
  );
  const [state, formAction, pending] = useActionState(saveSkinProfileAction, initialActionState);

  const toggleConcern = (concern: string) => setSelectedConcerns((previous) => (
    previous.includes(concern) ? previous.filter((item) => item !== concern) : [...previous, concern].slice(0, 4)
  ));
  const moveNext = () => {
    if (step === 2 && selectedConcerns.length === 0) return;
    setStep((current) => Math.min(3, current + 1));
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[radial-gradient(circle_at_80%_12%,rgba(223,133,159,.22),transparent_28%),linear-gradient(145deg,#fffafd,#fae5eb)] py-8 md:min-h-[calc(100vh-74px)] md:py-14">
      <div className="container-page max-w-3xl">
        <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm text-[#76685f]"><ArrowLeft size={16} /> 홈으로</Link>
        <div className="mb-8 flex items-end justify-between gap-5">
          <div><p className="eyebrow mb-3">SKIN PROFILE</p><h1 className="font-myeongjo text-3xl font-semibold md:text-4xl">{configured ? `${nickname}님의 피부를 다시 맞춰볼까요?` : "나의 피부를 알려주세요"}</h1></div>
          <span className="shrink-0 font-myeongjo text-sm text-[#9a6e60]">{step} / 3</span>
        </div>
        <div className="mb-8 flex gap-2">{[1, 2, 3].map((item) => <div key={item} className={`h-1.5 flex-1 rounded-full transition ${item <= step ? "bg-[#a54f63]" : "bg-[#efd9df]"}`} />)}</div>

        <form action={formAction} className="paper-card rounded-[30px] p-6 md:p-10">
          <input type="hidden" name="skinType" value={skin} />
          {selectedConcerns.map((concern) => <input key={concern} type="hidden" name="concerns" value={concern} />)}

          {step === 1 && <div>
            <div className="mb-7"><span className="text-xs font-bold text-[#a54f49]">STEP 01</span><h2 className="mt-2 font-myeongjo text-2xl font-semibold">평소 내 피부는 어떤가요?</h2><p className="mt-2 text-sm text-[#7e7168]">가장 가까운 한 가지를 골라주세요.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">{skinTypes.map(({ name, text, icon: Icon }) => <button type="button" key={name} onClick={() => setSkin(name)} aria-pressed={skin === name} className="glass-choice flex items-center gap-4 rounded-2xl p-4 text-left"><span className="choice-icon grid h-11 w-11 shrink-0 place-items-center rounded-full"><Icon size={19} /></span><span><strong className="font-myeongjo text-lg">{name}</strong><small className="mt-1 block text-[11px]">{text}</small></span>{skin === name && <Check size={17} className="ml-auto text-white" />}</button>)}</div>
            {state.fieldErrors.skinType && <p className="mt-4 text-xs text-[#a64e47]" role="alert">{state.fieldErrors.skinType}</p>}
          </div>}

          {step === 2 && <div>
            <div className="mb-7"><span className="text-xs font-bold text-[#a54f49]">STEP 02</span><h2 className="mt-2 font-myeongjo text-2xl font-semibold">요즘 가장 신경 쓰이는 건?</h2><p className="mt-2 text-sm text-[#7e7168]">1개 이상, 최대 4개까지 골라주세요. <span className="text-[#a54f49]">{selectedConcerns.length}/4</span></p></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{concerns.map((concern) => { const active = selectedConcerns.includes(concern); return <button type="button" key={concern} onClick={() => toggleConcern(concern)} aria-pressed={active} className="glass-choice relative min-h-24 rounded-2xl p-4 font-myeongjo text-[17px]">{active && <Check size={15} className="absolute right-3 top-3" />}<span className="mb-2 block text-2xl text-white/70">{active ? "✿" : "❀"}</span>{concern}</button>; })}</div>
            {(state.fieldErrors.concerns || selectedConcerns.length === 0) && <p className="mt-4 text-xs text-[#a64e47]" role="alert">{state.fieldErrors.concerns ?? "피부 고민을 하나 이상 선택해 주세요."}</p>}
          </div>}

          {step === 3 && <div>
            <div className="text-center"><span className="seal mx-auto h-14 w-14 font-myeongjo text-2xl">完</span><h2 className="mt-5 font-myeongjo text-2xl font-semibold">피부 화력 준비가 끝났어요</h2><p className="mt-2 text-sm text-[#7e7168]">입력한 내용을 확인하고 저장해 주세요.</p></div>
            <div className="glass-panel mt-8 rounded-2xl p-6">
              <div className="flex items-center justify-between border-b border-[#7656431c] pb-5"><span className="text-sm text-[#796c63]">나의 피부 타입</span><strong className="font-myeongjo text-xl text-[#984944]">{skin}</strong></div>
              <div className="pt-5"><span className="text-sm text-[#796c63]">피부 고민</span><div className="mt-3 flex flex-wrap gap-2">{selectedConcerns.map((item) => <span key={item} className="glass-chip-muted rounded-full px-3 py-2 text-xs text-[#62564f]">{item}</span>)}</div></div>
            </div>
            <div className="mt-5 flex gap-3 rounded-2xl border border-[#88937c26] bg-[#eaf0e43b] p-4"><Shield size={18} className="mt-0.5 shrink-0 text-[#6f7d67]" /><p className="text-xs leading-6 text-[#6e6d61]">저장한 피부 정보는 맞춤 분석에만 사용하며 언제든 다시 수정할 수 있어요.</p></div>
            {state.message && <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${state.success ? "border-[#71806b30] bg-[#eef3e9] text-[#5f705a]" : "border-[#b56b5725] bg-[#fff3ed] text-[#934d43]"}`} role={state.success ? "status" : "alert"} aria-live="polite">{state.message}</div>}
          </div>}

          <div className="mt-9 flex justify-between border-t border-[#76564316] pt-6">
            <button type="button" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || pending} className="line-btn disabled:invisible"><ArrowLeft size={16} /> 이전</button>
            {step < 3 ? <button type="button" onClick={moveNext} disabled={step === 2 && selectedConcerns.length === 0} className="ink-btn disabled:cursor-not-allowed disabled:opacity-50">다음 <ArrowRight size={16} /></button> : state.success ? <Link href="/products" className="ink-btn"><Sparkles size={16} /> 맞춤 화력 보러 가기</Link> : <button type="submit" disabled={pending} className="ink-btn disabled:cursor-wait disabled:opacity-65">{pending ? <><LoaderCircle size={16} className="animate-spin" /> 저장하고 있어요</> : <><Sparkles size={16} /> 피부 프로필 저장</>}</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
