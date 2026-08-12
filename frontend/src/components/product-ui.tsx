"use client";

import Link from "next/link";
import { Heart, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/types";

const toneMap = {
  peach: "from-[#f2c8b8] to-[#fbefe5]",
  sage: "from-[#bac6ad] to-[#edf0e6]",
  sand: "from-[#ddc7a8] to-[#f5eadc]",
  rose: "from-[#dda9aa] to-[#f7e7e2]",
  blue: "from-[#b7ccd0] to-[#ecf1ed]",
};

export function GradeSeal({ grade, compact = false }: { grade: number; compact?: boolean }) {
  return (
    <div className={`seal shrink-0 ${compact ? "h-11 w-11" : "h-16 w-16"}`} aria-label={`화력 ${grade}등급`}>
      <span className={`${compact ? "text-lg" : "text-2xl"} font-myeongjo font-bold leading-none`}>{grade}</span>
      <span className={`${compact ? "text-[8px]" : "text-[10px]"} tracking-[.1em]`}>등급</span>
    </div>
  );
}

export function FavoriteButton({ small = false }: { small?: boolean }) {
  const [active, setActive] = useState(false);
  return (
    <button
      onClick={(event) => { event.preventDefault(); setActive(!active); }}
      aria-label={active ? "찜 취소" : "찜하기"}
      aria-pressed={active}
      className={`${small ? "h-9 w-9" : "h-11 w-11"} grid place-items-center rounded-full border border-[#4e3e3420] bg-[#fffcf5d9] transition hover:-translate-y-0.5`}
    >
      <Heart size={small ? 16 : 19} className={active ? "fill-[#a54f49] text-[#a54f49]" : "text-[#675b52]"} />
    </button>
  );
}

export function ProductVisual({ tone, compact = false }: { tone: Product["tone"]; compact?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${toneMap[tone]} ${compact ? "h-40" : "h-56"}`}>
      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/35 blur-2xl" />
      <div className="absolute bottom-0 left-1/2 h-3 w-32 -translate-x-1/2 rounded-[50%] bg-[#6e514028] blur-sm" />
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 ${compact ? "scale-75" : "scale-100"}`}>
        <div className="relative h-32 w-24 rounded-[42%_42%_18%_18%] border border-white/70 bg-gradient-to-r from-white/75 via-white/35 to-white/65 shadow-[inset_-7px_0_12px_rgba(100,70,55,.08),0_16px_28px_rgba(70,48,38,.13)]">
          <div className="absolute -top-6 left-1/2 h-8 w-12 -translate-x-1/2 rounded-t-lg bg-gradient-to-r from-[#b08a6f] to-[#e4c0a2]" />
          <div className="absolute left-1/2 top-11 w-16 -translate-x-1/2 border-y border-[#7e5b4930] py-2 text-center font-myeongjo text-[9px] tracking-[.12em] text-[#6c5043]">花力<br /><span className="text-[7px]">SKIN RITUAL</span></div>
        </div>
      </div>
      <span className="absolute left-4 top-4 text-sm text-white/70">✿</span>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className="group paper-card relative block overflow-hidden rounded-[26px] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(78,56,43,.12)]">
      <div className="relative">
        <ProductVisual tone={product.tone} />
        {product.tag && <span className="absolute left-4 top-4 rounded-full bg-[#fffaf0dc] px-3 py-1.5 text-[11px] font-semibold text-[#875049] backdrop-blur">{product.tag}</span>}
        <div className="absolute right-4 top-4"><FavoriteButton small /></div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[.16em] text-[#8b776a]">{product.brand}</p>
            <h3 className="font-myeongjo text-[18px] font-semibold leading-snug transition group-hover:text-[#9b4a45]">{product.name}</h3>
          </div>
          <GradeSeal grade={product.grade} compact />
        </div>
        <div className="mb-4 flex items-end gap-2">
          <strong className="font-myeongjo text-3xl text-[#9b4a45]">{product.score}</strong>
          <span className="mb-1 text-xs text-[#807168]">/ 100 · 나의 적합도</span>
        </div>
        <div className="flex items-center justify-between border-t border-[#75564518] pt-4">
          <div className="flex gap-1.5 text-[11px] text-[#665b53]"><span className="rounded-full bg-[#aebaa340] px-2.5 py-1">{product.benefit}</span><span className="rounded-full bg-[#e9b3a635] px-2.5 py-1">{product.subBenefit}</span></div>
          <Plus size={17} className="text-[#9b4a45]" />
        </div>
      </div>
    </Link>
  );
}

export function ScoreRing({ score, size = "large" }: { score: number; size?: "small" | "large" }) {
  const px = size === "large" ? 172 : 110;
  return (
    <div className="relative grid shrink-0 place-items-center rounded-full" style={{ width: px, height: px, background: `conic-gradient(#a54f49 ${score * 3.6}deg, rgba(130,96,75,.11) 0)` }}>
      <div className="absolute inset-[9px] grid place-items-center rounded-full bg-[#fbf7ed] shadow-inner">
        <div className="text-center">
          <span className={`${size === "large" ? "text-5xl" : "text-3xl"} font-myeongjo font-semibold text-[#9b4a45]`}>{score}</span>
          <p className="mt-1 text-[10px] tracking-[.12em] text-[#7c6d63]">적합도</p>
        </div>
      </div>
    </div>
  );
}

export function InsightBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-[#a54f4912] px-3 py-1.5 text-xs font-semibold text-[#94453f]"><Sparkles size={13} /> 화력 해설</span>;
}
