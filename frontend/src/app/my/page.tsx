import Link from "next/link";
import { ArrowRight, Clock3, Heart, PencilLine, Scale, Settings, Sparkles } from "lucide-react";
import { GradeSeal, ProductVisual } from "@/components/product-ui";
import { products } from "@/lib/data";

export default function MyPage() {
  return <div className="min-h-screen pb-24">
    <section className="border-b border-[#74513f16] bg-[#eee2d2a6] py-12 md:py-16"><div className="container-page"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="eyebrow mb-4">MY HWA:RYEOK</p><h1 className="font-myeongjo text-4xl font-medium">윤서님의 피부가<br className="sm:hidden"/> 피어나는 곳</h1><p className="mt-4 text-sm text-[#75695f]">오늘도 피부에 맞는 좋은 선택을 쌓아가고 있어요.</p></div><Link href="/profile" className="line-btn self-start"><PencilLine size={16}/> 피부 정보 수정</Link></div></div></section>
    <section className="container-page -mt-1 py-9 md:py-12">
      <div className="paper-card grid overflow-hidden rounded-[28px] md:grid-cols-[1.15fr_.85fr]">
        <div className="p-6 md:p-9"><span className="rounded-full bg-[#a54f4910] px-3 py-1.5 text-xs font-semibold text-[#984944]">나의 피부 프로필</span><div className="mt-6 flex items-center gap-5"><span className="seal h-16 w-16 font-myeongjo text-2xl">水</span><div><h2 className="font-myeongjo text-2xl font-semibold">수부지 피부</h2><p className="mt-2 text-xs text-[#82736a]">겉은 가볍게, 속은 오래 촉촉하게</p></div></div><div className="mt-7 flex flex-wrap gap-2">{["민감","속건조","피부 장벽","모공"].map(item=><span key={item} className="rounded-full border border-[#74513f18] bg-[#fffaf3] px-3 py-2 text-xs text-[#6e625a]">{item}</span>)}</div></div>
        <div className="border-t border-[#74513f16] bg-[#f3e9db] p-6 md:border-l md:border-t-0 md:p-9"><div className="flex items-center gap-2 text-xs font-bold text-[#9b4a45]"><Sparkles size={14}/> 이번 주 피부 기록</div><p className="mt-4 font-myeongjo text-xl leading-8">장벽 제품을 자주 살펴보고 있어요.<br/>자극은 낮고 보습은 긴 제품이 잘 맞아요.</p><Link href="/products" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#8e4842]">맞춤 추천 새로 보기 <ArrowRight size={14}/></Link></div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">{[{icon:Heart,label:"찜한 제품",value:"12"},{icon:Scale,label:"비교한 제품",value:"6"},{icon:Clock3,label:"최근 본 제품",value:"18"}].map(({icon:Icon,label,value})=><div key={label} className="rounded-2xl border border-[#74513f17] bg-[#fffaf287] p-5"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#e7c4b92b] text-[#9c514a]"><Icon size={17}/></span><strong className="font-myeongjo text-2xl">{value}</strong></div><p className="mt-4 text-xs text-[#7d7067]">{label}</p></div>)}</div>

      <DashboardRow title="나의 1등급 제품" subtitle="지금 피부에 가장 잘 맞는 제품이에요" href="/products" products={products.slice(0,3)}/>
      <DashboardRow title="최근 확인한 화력" subtitle="궁금해서 살펴본 분석 기록이에요" href="/products" products={products.slice(2,5)}/>

      <div className="mt-14 rounded-[26px] border border-[#74513f18] bg-[#f3eadc87] p-6 sm:flex sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Settings size={16}/><h2 className="font-myeongjo text-xl font-semibold">피부 정보가 달라졌나요?</h2></div><p className="mt-2 text-xs leading-6 text-[#7c6f66]">프로필을 바꾸면 모든 화력 점수와 추천 순위가 새롭게 계산돼요.</p></div><Link href="/profile" className="line-btn mt-5 sm:mt-0">다시 분석하기</Link></div>
    </section>
  </div>;
}

function DashboardRow({title,subtitle,href,products:items}:{title:string;subtitle:string;href:string;products:typeof products}) {
  return <section className="mt-14"><div className="mb-6 flex items-end justify-between"><div><h2 className="font-myeongjo text-2xl font-semibold">{title}</h2><p className="mt-2 text-xs text-[#82736a]">{subtitle}</p></div><Link href={href} className="text-xs font-semibold text-[#9b4a45]">모두 보기</Link></div><div className="scrollbar-hide flex gap-4 overflow-x-auto pb-3">{items.map(product=><Link href={`/products/${product.id}`} key={product.id} className="paper-card flex min-w-[285px] items-center gap-4 rounded-2xl p-3 pr-4 sm:min-w-[330px]"><div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl"><ProductVisual tone={product.tone} compact/></div><div className="min-w-0 flex-1"><p className="text-[9px] font-bold tracking-wider text-[#8b776a]">{product.brand}</p><h3 className="mt-1 truncate font-myeongjo font-semibold">{product.name}</h3><div className="mt-3 flex items-end justify-between"><GradeSeal grade={product.grade} compact/><strong className="font-myeongjo text-2xl text-[#9b4a45]">{product.score}</strong></div></div></Link>)}</div></section>;
}
