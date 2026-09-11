import Link from "next/link";
import { FlaskConical, Star } from "lucide-react";
import { FavoriteButton, ProductVisual } from "@/components/product-ui";
import type { IngredientRankingItem, IngredientRankingSort } from "@/lib/types";

export function IngredientRankingCard({ item, ingredientName, sort, favorited, isAuthenticated, returnTo }: {
  item: IngredientRankingItem;
  ingredientName: string | null;
  sort: IngredientRankingSort;
  favorited: boolean;
  isAuthenticated: boolean;
  returnTo: string;
}) {
  const { product } = item;
  const reviewMode = sort === "REVIEW";
  const showReviewScore = reviewMode || !ingredientName;
  const score = showReviewScore ? item.reviewScore : item.firepowerScore;
  return <article className="group relative min-w-0 overflow-hidden rounded-2xl border border-[#eddee3] bg-white transition hover:border-[#d79bb0]">
    <Link href={`/products/${product.id}`} className="block h-full">
      <div className="relative aspect-square overflow-hidden border-b border-[#f4e9ed] bg-white p-3 sm:p-5">
        <ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={`${product.brand} ${product.name}`} variant="fill" />
        {item.rank !== null && (ingredientName || reviewMode) && <span aria-label={`${item.rank}위`} className={`absolute left-2.5 top-2.5 z-20 grid h-8 w-8 place-items-center rounded-lg text-sm font-bold sm:left-3 sm:top-3 ${item.rank <= 3 ? "bg-[#cf5b7d] text-white" : "bg-[#fff0f5] text-[#ab4c6b]"}`}>{item.rank}</span>}
        {reviewMode && item.rank === null && <span className="absolute bottom-2 left-2 z-20 rounded-full bg-[#fff4f7] px-2 py-1 text-[10px] font-semibold text-[#a57888]">리뷰 집계 대기</span>}
      </div>
      <div className="p-3 sm:p-4">
        <p className="truncate text-[10px] text-[#9b848e] sm:text-xs">{product.brand} <span className="mx-1 text-[#dccbd2]">·</span> {product.category}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-[#493b41] group-hover:text-[#b3476b] sm:text-[15px]">{product.name}</h3>
        <p className="mt-2 text-xs font-semibold text-[#74606a]">{product.price}</p>
        {ingredientName && <div className="mt-2 min-h-9 rounded-lg bg-[#fff7f9] px-2.5 py-2 text-[9px] leading-4 text-[#806b73]">
          {item.amount?.verificationStatus === "VERIFIED" ? <><p className="flex items-center gap-1 font-bold text-[#a04464]"><FlaskConical size={10} /> 공개 함량 {item.amount.displayValue}</p><p>{item.amount.amountPerContainer ?? item.amount.comparisonNote}</p></> : <p><strong className="text-[#76666e]">정확 함량 미공개</strong> · 전성분 순서는 실제 함량이 아니에요</p>}
        </div>}
        <div className="mt-3 border-t border-[#f4e9ed] pt-3">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1"><strong className="text-xl font-bold tabular-nums text-[#bb4b70] sm:text-2xl">{score === null ? "—" : Number.isInteger(score) ? score : score.toFixed(1)}</strong><span className="text-[10px] text-[#8d7580]">{showReviewScore ? "리뷰점수 / 100" : "성분 화력 / 100"}</span></div>
          <p className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-[#9a838d]"><Star size={11} className="text-[#cf7893]" />{item.reviewCount > 0 ? `리뷰 ${item.reviewCount}개${!showReviewScore && item.reviewScore !== null ? ` · ${item.reviewScore}점` : ""}` : "첫 리뷰를 기다려요"}</p>
        </div>
        {ingredientName && <span className="mt-3 inline-block max-w-full truncate rounded-md bg-[#fff2f6] px-2 py-1 text-[10px] font-semibold text-[#af5976]">#{ingredientName}</span>}
      </div>
    </Link>
    <div className="absolute right-2 top-2 z-20 sm:right-3 sm:top-3"><FavoriteButton productId={product.id} initialFavorited={favorited} isAuthenticated={isAuthenticated} returnTo={returnTo} small /></div>
  </article>;
}
