"use client";

import Link from "next/link";
import { Check, ChevronDown, Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { GradeSeal, ProductVisual } from "@/components/product-ui";
import { products, scoreDetails } from "@/lib/data";

export default function ComparePage() {
  const [leftId, setLeftId] = useState(products[0].id);
  const [rightId, setRightId] = useState(products[1].id);
  const left = products.find(product => product.id === leftId)!;
  const right = products.find(product => product.id === rightId)!;
  const rows = [
    { label: "보습력", a: 96, b: 84, higher: true },
    { label: "진정력", a: 92, b: 95, higher: true },
    { label: "피부 장벽", a: 95, b: 79, higher: true },
    { label: "유분 부담", a: 24, b: 16, higher: false },
    { label: "트러블 위험", a: 12, b: 20, higher: false },
  ];
  return <div className="min-h-screen pb-24">
    <section className="border-b border-[#74513f16] bg-[#f3e9dc8c] py-14 text-center"><div className="container-page"><p className="eyebrow mb-4">COMPARE POWER</p><h1 className="font-myeongjo text-4xl md:text-5xl">내 피부 앞에 나란히 놓고 보기</h1><p className="mt-4 text-sm text-[#786c63]">숫자만 비교하지 않고, 지금 피부에 더 잘 맞는 이유까지 알려드려요.</p></div></section>
    <section className="container-page py-10 md:py-16">
      <div className="overflow-hidden rounded-[30px] border border-[#74513f1a] bg-[#fffaf2a8]">
        <div className="grid grid-cols-[78px_1fr_1fr] sm:grid-cols-[170px_1fr_1fr]">
          <div className="border-b border-r border-[#74513f18] bg-[#f0e5d7]" />
          {[{product:left,set:setLeftId},{product:right,set:setRightId}].map(({product,set},index)=><div key={index} className={`border-b border-[#74513f18] p-3 sm:p-6 ${index===0?"border-r":""}`}><div className="relative mb-4 overflow-hidden rounded-xl"><ProductVisual tone={product.tone} compact/></div><div className="relative"><select aria-label={`${index+1}번째 비교 제품`} value={product.id} onChange={e=>set(e.target.value)} className="h-11 w-full appearance-none rounded-xl border border-[#74513f20] bg-[#fffdf7] pl-3 pr-8 text-xs font-semibold outline-none sm:text-sm">{products.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5" size={14}/></div></div>)}
          <CompareLabel label="나의 화력" />
          {[left,right].map((product,index)=><div key={product.id} className={`flex flex-col items-center justify-center gap-3 border-b border-[#74513f18] p-4 sm:flex-row ${index===0?"border-r":""}`}><GradeSeal grade={product.grade} compact/><span className="text-center text-[11px] text-[#776a61]">{product.grade===1?"매우 잘 맞아요":"잘 맞는 편이에요"}</span></div>)}
          <CompareLabel label="적합도" />
          {[left,right].map((product,index)=><div key={product.id} className={`border-b border-[#74513f18] p-5 text-center ${index===0?"border-r bg-[#a54f4905]":""}`}><strong className="font-myeongjo text-4xl text-[#9b4a45]">{product.score}</strong><span className="text-xs text-[#897a70]"> / 100</span></div>)}
          {rows.map(row=><div key={row.label} className="contents"><CompareLabel label={row.label}/>{[{value:row.a,other:row.b},{value:row.b,other:row.a}].map(({value,other},index)=>{const winner=row.higher?value>other:value<other;return <div key={index} className={`relative border-b border-[#74513f18] p-4 text-center sm:p-6 ${index===0?"border-r":""} ${winner?"bg-[#8593790c]":""}`}><strong className="font-myeongjo text-2xl">{value}</strong>{winner&&<Check size={15} className="absolute right-2 top-2 text-[#73806c]"/>}<div className="mx-auto mt-2 h-1.5 max-w-24 overflow-hidden rounded-full bg-[#d6c6b74d]"><div className={`${row.higher?"bg-[#84917b]":"bg-[#c98b75]"} h-full rounded-full`} style={{width:`${value}%`}}/></div></div>})}</div>)}
        </div>
      </div>
      <div className="mt-7 rounded-[26px] border border-[#a54f4922] bg-[#f1e2db73] p-6 md:flex md:items-center md:gap-6 md:p-8"><span className="seal h-12 w-12 shrink-0 font-myeongjo text-xl">解</span><div className="mt-4 md:mt-0"><div className="flex items-center gap-2 text-xs font-bold text-[#994944]"><Sparkles size={14}/> 화력의 결론</div><p className="mt-2 font-myeongjo text-lg leading-8"><strong>{left.name}</strong>을 더 추천해요. 속건조와 피부 장벽 항목에서 지금 피부에 더 높은 적합도를 보여요.</p></div><Link href={`/products/${left.id}`} className="line-btn mt-5 shrink-0 md:ml-auto md:mt-0">상세 분석 보기</Link></div>
      <button className="line-btn mx-auto mt-8"><Plus size={16}/> 비교 제품 하나 더 담기</button>
    </section>
  </div>;
}

function CompareLabel({label}:{label:string}) { return <div className="flex items-center border-b border-r border-[#74513f18] bg-[#f5ecdf] p-3 text-[11px] font-semibold text-[#72665e] sm:p-5 sm:text-sm">{label}</div>; }
