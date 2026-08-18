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
  peach: "from-[#f2c8b8] to-[#fbefe5]",
  sage: "from-[#bac6ad] to-[#edf0e6]",
  sand: "from-[#ddc7a8] to-[#f5eadc]",
  rose: "from-[#dda9aa] to-[#f7e7e2]",
  blue: "from-[#b7ccd0] to-[#ecf1ed]",
};

function displayTag(tag: string) {
  return tag.replace(/^화해 급상승/, "화력 급상승");
}

export function GradeSeal({ grade, compact = false }: { grade: number; compact?: boolean }) {
  return (
    <div className={`seal shrink-0 ${compact ? "h-11 w-11" : "h-16 w-16"}`} aria-label={`화력 ${grade}등급`}>
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
        <Heart size={small ? 17 : 19} className={`${active ? "fill-white text-white" : "text-white/80"} ${pending ? "animate-pulse" : ""}`} />
      </button>
      <span className="sr-only" role="status" aria-live="polite">{statusMessage}</span>
      {error && !pending && <span role="alert" className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-[#a54f4930] bg-[#fffaf3] px-3 py-2 text-left text-[11px] leading-5 text-[#8f433e] shadow-lg">{error}</span>}
    </div>
  );
}

export function ProductVisual({
  tone,
  compact = false,
  imageUrl,
  alt = "화장품 제품 이미지",
}: {
  tone: Product["tone"];
  compact?: boolean;
  imageUrl?: string | null;
  alt?: string;
}) {
  const resolvedImageUrl = resolveProductImageUrl(imageUrl);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${toneMap[tone]} ${compact ? "h-36 sm:h-40" : "h-52 sm:h-56"}`}>
      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/35 blur-2xl" />
      <div className="absolute bottom-0 left-1/2 h-3 w-32 -translate-x-1/2 rounded-[50%] bg-[#6e514028] blur-sm" />
      {resolvedImageUrl ? (
        <Image
          src={resolvedImageUrl}
          alt={alt}
          fill
          sizes={compact ? "(max-width: 768px) 45vw, 320px" : "(max-width: 768px) 92vw, 420px"}
          className="z-10 object-contain p-4 drop-shadow-[0_16px_18px_rgba(70,48,38,.18)] sm:p-5"
        />
      ) : (
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 ${compact ? "scale-75" : "scale-100"}`}>
          <div className="relative h-32 w-24 rounded-[42%_42%_18%_18%] border border-white/70 bg-gradient-to-r from-white/75 via-white/35 to-white/65 shadow-[inset_-7px_0_12px_rgba(100,70,55,.08),0_16px_28px_rgba(70,48,38,.13)]">
            <div className="absolute -top-6 left-1/2 h-8 w-12 -translate-x-1/2 rounded-t-lg bg-gradient-to-r from-[#b08a6f] to-[#e4c0a2]" />
            <div className="absolute left-1/2 top-11 w-16 -translate-x-1/2 border-y border-[#7e5b4930] py-2 text-center font-myeongjo text-[9px] tracking-[.12em] text-[#6c5043]">花力<br /><span className="text-[7px]">SKIN RITUAL</span></div>
          </div>
        </div>
      )}
      <span className="absolute left-4 top-4 text-sm text-white/70">✿</span>
    </div>
  );
}

export function ProductCard({
  product,
  initialFavorited = false,
  isAuthenticated = false,
  returnTo,
}: {
  product: Product;
  initialFavorited?: boolean;
  isAuthenticated?: boolean;
  returnTo?: string;
}) {
  return (
    <article className="group paper-card relative overflow-hidden rounded-[26px] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(78,56,43,.12)]">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative">
          <ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} />
          {product.tag && <span className="absolute left-4 top-4 max-w-[calc(100%-5rem)] truncate rounded-full border border-white/80 bg-white/78 px-3 py-1.5 text-[11px] font-semibold text-[#9b4d62] shadow-sm backdrop-blur-xl">{displayTag(product.tag)}</span>}
        </div>
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[.16em] text-[#8b776a]">{product.brand}</p>
              <h3 className="line-clamp-2 font-myeongjo text-[18px] font-semibold leading-snug transition group-hover:text-[#9b4a45]">{product.name}</h3>
            </div>
            <GradeSeal grade={product.grade} compact />
          </div>
          <div className="mb-4 flex items-end gap-2">
            <strong className="font-myeongjo text-3xl text-[#9b4a45]">{product.score}</strong>
            <span className="mb-1 text-xs text-[#807168]">/ 100 · 나의 적합도</span>
          </div>
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

export function ScoreRing({ score, size = "large" }: { score: number; size?: "small" | "large" }) {
  const sizeClass = size === "large" ? "h-[148px] w-[148px] sm:h-[172px] sm:w-[172px]" : "h-[92px] w-[92px] sm:h-[110px] sm:w-[110px]";
  return (
    <div className={`relative grid shrink-0 place-items-center rounded-full ${sizeClass}`} style={{ background: `conic-gradient(#a54f49 ${score * 3.6}deg, rgba(130,96,75,.11) 0)` }}>
      <div className="absolute inset-[9px] grid place-items-center rounded-full bg-white shadow-inner">
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
