"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Droplets, Flower2, Leaf, Shield, Sparkles, SunMedium, Waves } from "lucide-react";
import { useState } from "react";
import { concerns } from "@/lib/data";

const skinTypes = [
  { name: "건성", text: "세안 후 당김이 자주 느껴져요", icon: Droplets },
  { name: "지성", text: "유분과 번들거림이 쉽게 생겨요", icon: SunMedium },
  { name: "복합성", text: "T존은 유분, 볼은 건조해요", icon: Waves },
  { name: "수부지", text: "겉은 번들거리지만 속은 당겨요", icon: Flower2 },
  { name: "중성", text: "유수분 균형이 비교적 편안해요", icon: Leaf },
];

export default function ProfilePage() {
  const [step, setStep] = useState(1);
  const [skin, setSkin] = useState("수부지");
  const [selectedConcerns, setSelectedConcerns] = useState(["속건조", "민감", "피부 장벽"]);

  const toggleConcern = (concern: string) => setSelectedConcerns(prev => prev.includes(concern) ? prev.filter(item => item !== concern) : [...prev, concern].slice(0,4));

  return (
    <div className="min-h-[calc(100vh-74px)] bg-[#f6eee2] py-8 md:py-14">
      <div className="container-page max-w-3xl">
        <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm text-[#76685f]"><ArrowLeft size={16} /> 홈으로</Link>
        <div className="mb-8 flex items-center justify-between">
          <div><p className="eyebrow mb-3">SKIN PROFILE</p><h1 className="font-myeongjo text-3xl font-semibold md:text-4xl">나의 피부를 알려주세요</h1></div>
          <span className="font-myeongjo text-sm text-[#9a6e60]">{step} / 3</span>
        </div>
        <div className="mb-8 flex gap-2">{[1,2,3].map(item => <div key={item} className={`h-1.5 flex-1 rounded-full transition ${item <= step ? "bg-[#a8564f]" : "bg-[#d9cbbd]"}`} />)}</div>

        <div className="paper-card rounded-[30px] p-6 md:p-10">
          {step === 1 && <div>
            <div className="mb-7"><span className="text-xs font-bold text-[#a54f49]">STEP 01</span><h2 className="mt-2 font-myeongjo text-2xl font-semibold">평소 내 피부는 어떤가요?</h2><p className="mt-2 text-sm text-[#7e7168]">가장 가까운 한 가지를 골라주세요.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">{skinTypes.map(({ name, text, icon: Icon }) => <button key={name} onClick={() => setSkin(name)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${skin === name ? "border-[#a54f49] bg-[#a54f490b] shadow-[0_8px_20px_rgba(122,69,54,.08)]" : "border-[#7656431b] bg-[#fffdf8]"}`}><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${skin === name ? "bg-[#a54f49] text-white" : "bg-[#eee4d6] text-[#7e6e63]"}`}><Icon size={19} /></span><span><strong className="font-myeongjo text-lg">{name}</strong><small className="mt-1 block text-[11px] text-[#83766d]">{text}</small></span>{skin === name && <Check size={17} className="ml-auto text-[#a54f49]" />}</button>)}</div>
          </div>}

          {step === 2 && <div>
            <div className="mb-7"><span className="text-xs font-bold text-[#a54f49]">STEP 02</span><h2 className="mt-2 font-myeongjo text-2xl font-semibold">요즘 가장 신경 쓰이는 건?</h2><p className="mt-2 text-sm text-[#7e7168]">최대 4개까지 고를 수 있어요. <span className="text-[#a54f49]">{selectedConcerns.length}/4</span></p></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{concerns.map(concern => { const active = selectedConcerns.includes(concern); return <button key={concern} onClick={() => toggleConcern(concern)} className={`relative min-h-24 rounded-2xl border p-4 font-myeongjo text-[17px] transition ${active ? "border-[#a54f49] bg-[#eed2c93d] text-[#8f433e]" : "border-[#7656431b] bg-[#fffdf8] hover:border-[#a97a68]"}`}>{active && <Check size={15} className="absolute right-3 top-3" />}<span className="mb-2 block text-2xl text-[#d18874]">{active ? "✿" : "❀"}</span>{concern}</button>})}</div>
          </div>}

          {step === 3 && <div>
            <div className="text-center"><span className="seal mx-auto h-14 w-14 font-myeongjo text-2xl">完</span><h2 className="mt-5 font-myeongjo text-2xl font-semibold">피부 화력 준비가 끝났어요</h2><p className="mt-2 text-sm text-[#7e7168]">입력한 내용을 마지막으로 확인해주세요.</p></div>
            <div className="mt-8 rounded-2xl bg-[#f4eadc] p-6">
              <div className="flex items-center justify-between border-b border-[#7656431c] pb-5"><span className="text-sm text-[#796c63]">나의 피부 타입</span><strong className="font-myeongjo text-xl text-[#984944]">{skin}</strong></div>
              <div className="pt-5"><span className="text-sm text-[#796c63]">피부 고민</span><div className="mt-3 flex flex-wrap gap-2">{selectedConcerns.map(item => <span key={item} className="rounded-full bg-[#fffaf1] px-3 py-2 text-xs text-[#62564f]">{item}</span>)}</div></div>
            </div>
            <div className="mt-5 flex gap-3 rounded-2xl border border-[#88937c26] bg-[#eaf0e43b] p-4"><Shield size={18} className="mt-0.5 shrink-0 text-[#6f7d67]" /><p className="text-xs leading-6 text-[#6e6d61]">피부 정보는 오직 맞춤 분석에만 사용돼요. 프로필은 마이화력에서 언제든 수정할 수 있습니다.</p></div>
          </div>}

          <div className="mt-9 flex justify-between border-t border-[#76564316] pt-6">
            <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="line-btn disabled:invisible"><ArrowLeft size={16} /> 이전</button>
            {step < 3 ? <button onClick={() => setStep(step + 1)} className="ink-btn">다음 <ArrowRight size={16} /></button> : <Link href="/products" className="ink-btn"><Sparkles size={16} /> 나의 화력 시작하기</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
