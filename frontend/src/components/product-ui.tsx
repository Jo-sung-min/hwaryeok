"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { setFavoriteAction } from "@/app/favorites/actions";
import type { Product } from "@/lib/types";
import { resolveProductImageUrl } from "@/lib/media";

const toneMap = {
  peach: "bg-[#fff0ed]",
  sage: "bg-[#f2f5ef]",
  sand: "bg-[#f7f1e9]",
  rose: "bg-[#fff0f4]",
  blue: "bg-[#eef5f6]",
};

export function GradeSeal({ grade, compact = false }: { grade: number; compact?: boolean }) {
  return (
    <div className={`seal shrink-0 ${compact ? "h-11 w-11" : "h-16 w-16"}`} aria-label={`성분·적합 ${grade}등급`}>
      <span className={`${compact ? "text-lg" : "text-2xl"} font-myeongjo font-bold leading-none`}>{grade}</span>
      <span className={`${compact ? "text-[8px]" : "text-[10px]"} tracking-[.1em]`}>등급</span>
    </div>
  );
}

export function FavoriteButton({
  productId,
  initialFavorited = false,
  isAuthenticated = false,
  returnTo,
  small = false,
}: {
  productId: string;
  initialFavorited?: boolean;
  isAuthenticated?: boolean;
  returnTo?: string;
  small?: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initialFavorited);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => setActive(initialFavorited), [initialFavorited]);

  function toggleFavorite() {
    const safeReturnTo = returnTo ?? `/products/${productId}`;
    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(safeReturnTo)}`);
      return;
    }

    const nextFavorited = !active;
    setActive(nextFavorited);
    setError("");
    startTransition(async () => {
      const result = await setFavoriteAction(productId, nextFavorited);
      setActive(result.favorited);
      setStatusMessage(result.message);
      if (!result.success) setError(result.message);
      if (result.requiresLogin) router.push(`/login?returnTo=${encodeURIComponent(safeReturnTo)}`);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={pending}
        aria-label={pending ? "찜 상태 저장 중" : active ? "찜 취소" : "찜하기"}
        aria-pressed={active}
        aria-busy={pending}
        className={`${small ? "h-11 w-11 sm:h-10 sm:w-10" : "h-11 w-11"} glass-choice grid place-items-center rounded-full disabled:cursor-wait disabled:opacity-65`}
      >
        <Heart size={small ? 17 : 19} className={`${active ? "fill-[#c94f74] text-[#c94f74]" : "text-[#b45b75]"} ${pending ? "animate-pulse" : ""}`} />
      </button>
      <span className="sr-only" role="status" aria-live="polite">{statusMessage}</span>
      {error && !pending && <span role="alert" className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-[#a54f4930] bg-[#fffaf3] px-3 py-2 text-left text-[11px] leading-5 text-[#8f433e] shadow-lg">{error}</span>}
    </div>
  );
}

export function ProductVisual({
  tone,
  variant = "card",
  imageUrl,
  alt = "화장품 제품 이미지",
}: {
  tone: Product["tone"];
  variant?: "card" | "compact" | "thumbnail" | "comparison" | "fill" | "panel" | "catalog";
  imageUrl?: string | null;
  alt?: string;
}) {
  const resolvedImageUrl = resolveProductImageUrl(imageUrl);
  const visualSize = {
    card: "h-64",
    compact: "h-44 sm:h-48",
    thumbnail: "h-full w-full",
    comparison: "h-full w-full",
    fill: "h-full w-full",
    panel: "h-64 sm:h-full",
    catalog: "h-full w-full",
  }[variant];
  const responsiveSizes = {
    card: "(max-width: 768px) calc(100vw - 48px), (max-width: 1280px) 50vw, 380px",
    compact: "(max-width: 768px) 82vw, 360px",
    thumbnail: "96px",
    comparison: "(max-width: 640px) 50vw, 520px",
    fill: "(max-width: 1024px) 100vw, 46vw",
    panel: "(max-width: 640px) 100vw, 220px",
    catalog: "(max-width: 767px) 43vw, (max-width: 1220px) 25vw, 278px",
  }[variant];

  return (
    <div className={`relative overflow-hidden ${visualSize} ${resolvedImageUrl ? "bg-white" : toneMap[tone]}`}>
      {resolvedImageUrl ? (
        <Image
          src={resolvedImageUrl}
          alt={alt}
          fill
          sizes={responsiveSizes}
          loading={variant === "fill" ? "eager" : "lazy"}
          className="z-10 object-contain object-center transition-transform duration-500 group-hover:scale-[1.025]"
        />
      ) : (
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 ${variant === "thumbnail" || variant === "compact" ? "scale-75" : "scale-100"}`}>
          <div className="relative h-32 w-24 rounded-[42%_42%_18%_18%] border border-[#ead9dc] bg-white shadow-[0_14px_26px_rgba(70,48,38,.1)]">
            <div className="absolute -top-6 left-1/2 h-8 w-12 -translate-x-1/2 rounded-t-lg bg-[#d8ad91]" />
            <div className="absolute left-1/2 top-11 w-16 -translate-x-1/2 border-y border-[#7e5b4930] py-2 text-center font-myeongjo text-[9px] tracking-[.12em] text-[#6c5043]">花力<br /><span className="text-[7px]">SKIN RITUAL</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductCard({
  product,
  initialFavorited = false,
  isAuthenticated = false,
  returnTo,
  scoreLabel = "성분 기준 점수",
}: {
  product: Product;
  initialFavorited?: boolean;
  isAuthenticated?: boolean;
  returnTo?: string;
  scoreLabel?: string;
}) {
  return (
    <article className="group paper-card relative overflow-hidden rounded-[26px] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(78,56,43,.12)]">
      <Link href={`/products/${product.id}`} className="block">
        <ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} />
        <div className="border-t border-[#f2dfe5] p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold">
            <span className="rounded-full bg-[#fff0f4] px-2.5 py-1 text-[#a44762]">성분 근거 {confidenceLabel(product.confidenceLevel)}</span>
            <span className="truncate text-[#9a858c]">{product.category}</span>
          </div>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[.16em] text-[#8b776a]">{product.brand}</p>
              <h3 className="line-clamp-2 font-myeongjo text-[18px] font-semibold leading-snug transition group-hover:text-[#9b4a45]">{product.name}</h3>
            </div>
            <GradeSeal grade={product.grade} compact />
          </div>
          <div className="mb-4 flex items-end gap-2">
            <strong className="font-myeongjo text-3xl text-[#9b4a45]">{product.score}</strong>
            <span className="mb-1 text-xs text-[#807168]">/ 100 · {scoreLabel}</span>
          </div>
          {product.matchReasons?.[0] && <p className="mb-4 line-clamp-2 min-h-10 rounded-xl bg-[#fff1f4] px-3 py-2 text-[11px] leading-5 text-[#745d65]">{product.matchReasons[0]}</p>}
          <div className="flex items-center justify-between border-t border-[#75564518] pt-4">
            <div className="flex gap-1.5 overflow-hidden text-[11px] text-[#665b53]"><span className="truncate rounded-full bg-[#aebaa340] px-2.5 py-1">{product.benefit}</span><span className="truncate rounded-full bg-[#e9b3a635] px-2.5 py-1">{product.subBenefit}</span></div>
            <Plus size={17} className="shrink-0 text-[#9b4a45]" />
          </div>
        </div>
      </Link>
      <div className="absolute right-4 top-4 z-20">
        <FavoriteButton productId={product.id} initialFavorited={initialFavorited} isAuthenticated={isAuthenticated} returnTo={returnTo} small />
      </div>
    </article>
  );
}

function confidenceLabel(value?: Product["confidenceLevel"]) {
  if (value === "HIGH") return "높음";
  if (value === "MEDIUM") return "보통";
  return "확인 중";
}

export function ScoreRing({ score, size = "large" }: { score: number; size?: "small" | "large" }) {
  const sizeClass = size === "large" ? "h-[148px] w-[148px] sm:h-[172px] sm:w-[172px]" : "h-[92px] w-[92px] sm:h-[110px] sm:w-[110px]";
  return (
    <div className={`relative grid shrink-0 place-items-center rounded-full border-[9px] border-[#efbdcb] bg-[#fff3f6] ${sizeClass}`} aria-label={`적합도 ${score}점`}>
      <div className="absolute inset-0 grid place-items-center rounded-full bg-white">
        <div className="text-center">
          <span className={`${size === "large" ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"} font-myeongjo font-semibold text-[#9b4a45]`}>{score}</span>
          <p className="mt-1 text-[10px] tracking-[.12em] text-[#7c6d63]">적합도</p>
        </div>
      </div>
    </div>
  );
}

export function InsightBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-[#a54f4912] px-3 py-1.5 text-xs font-semibold text-[#94453f]"><Sparkles size={13} /> 화력 해설</span>;
}
