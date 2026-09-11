"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ImageIcon, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { FavoriteButton } from "@/components/product-ui";
import { resolveProductImageUrl } from "@/lib/media";
import { appendUniqueProducts } from "@/lib/product-catalog";
import type { Product, ProductPage } from "@/lib/types";
import styles from "./product-catalog-grid.module.css";

type ProductCatalogGridProps = {
  initialPage: ProductPage;
  favoriteIds: string[];
  isAuthenticated: boolean;
  returnTo: string;
  feedUrl: string;
  scoreLabel: string;
  activeConcern?: string;
};

function nextPageHref(feedUrl: string, pageIndex: number) {
  const url = new URL(feedUrl, "http://hwaryeok.local");
  url.searchParams.set("page", String(pageIndex + 1));
  return `/products?${url.searchParams}`;
}

function feedPageUrl(feedUrl: string, pageIndex: number) {
  const url = new URL(feedUrl, "http://hwaryeok.local");
  url.searchParams.set("cursor", String(pageIndex));
  return `${url.pathname}?${url.searchParams}`;
}

export function ProductCatalogGrid({ initialPage, favoriteIds, isAuthenticated, returnTo, feedUrl, scoreLabel, activeConcern }: ProductCatalogGridProps) {
  const [products, setProducts] = useState(initialPage.content);
  const [hasNext, setHasNext] = useState(initialPage.hasNext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightPageRef = useRef<number | null>(null);
  const nextPageRef = useRef(initialPage.page + 1);
  const loadedPagesRef = useRef(new Set([initialPage.page]));
  const productIdsRef = useRef(new Set(initialPage.content.map((product) => product.id)));
  const requestKeyRef = useRef(feedUrl);
  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const loadMore = useCallback(async () => {
    const pageIndex = nextPageRef.current;
    if (!hasNext || inFlightPageRef.current !== null || loadedPagesRef.current.has(pageIndex)) return;

    inFlightPageRef.current = pageIndex;
    const requestKey = requestKeyRef.current;
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(feedPageUrl(feedUrl, pageIndex), {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });
      const body = await response.json().catch(() => null) as ProductPage | { message?: string } | null;
      if (!response.ok) throw new Error(body && "message" in body ? body.message : "상품을 더 불러오지 못했어요.");
      if (!body || !("content" in body) || body.page !== pageIndex) throw new Error("상품 목록의 다음 위치를 확인하지 못했어요.");
      if (requestKeyRef.current !== requestKey || controller.signal.aborted) return;

      const addedCount = body.content.filter((product) => !productIdsRef.current.has(product.id)).length;
      body.content.forEach((product) => productIdsRef.current.add(product.id));
      setProducts((current) => appendUniqueProducts(current, body.content));
      loadedPagesRef.current.add(pageIndex);
      nextPageRef.current = pageIndex + 1;
      const canContinue = body.hasNext && body.content.length > 0;
      setHasNext(canContinue);
      setStatusMessage(addedCount > 0 ? `${addedCount}개 제품을 더 불러왔어요.` : "현재 조건의 제품을 모두 확인했어요.");
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(loadError instanceof Error ? loadError.message : "상품을 더 불러오지 못했어요.");
    } finally {
      if (inFlightPageRef.current === pageIndex) inFlightPageRef.current = null;
      if (abortRef.current === controller) abortRef.current = null;
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, [feedUrl, hasNext]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNext || error || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasNext, loadMore]);

  function handleLoadMore(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void loadMore();
  }

  const fallbackHref = nextPageHref(feedUrl, nextPageRef.current);
  const showCompletion = initialPage.totalPages > 1 && !hasNext;
  const completionCopy = initialPage.page === 0 && products.length === initialPage.totalElements
    ? `총 ${initialPage.totalElements}개 제품을 모두 봤어요.`
    : "현재 위치부터 마지막 제품까지 모두 봤어요.";

  return (
    <div className={styles.catalog} aria-busy={isLoading}>
      <div className={styles.gridFrame}>
        <ul className={styles.grid} aria-label="화장품 검색 결과">
          {products.map((product, index) => (
            <li key={product.id}>
              <CatalogProductCard
                product={product}
                eager={index < 3}
                favorited={favorites.has(product.id)}
                isAuthenticated={isAuthenticated}
                returnTo={returnTo}
                scoreLabel={scoreLabel}
                activeConcern={activeConcern}
              />
            </li>
          ))}
        </ul>
      </div>

      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <div className={styles.loadArea}>
        {hasNext ? (
          <Link
            href={fallbackHref}
            prefetch={false}
            onClick={handleLoadMore}
            className={styles.loadMore}
            aria-disabled={isLoading}
          >
            {isLoading ? <LoaderCircle size={16} className={styles.spinner} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
            {isLoading ? "다음 제품을 불러오는 중" : "제품 더 보기"}
          </Link>
        ) : showCompletion ? (
          <p className={styles.complete}>{completionCopy}</p>
        ) : null}
        {error && <p className={styles.error} role="alert">{error} 제품 더 보기 버튼을 눌러 다시 시도해 주세요.</p>}
      </div>
      <p className="sr-only" role="status" aria-live="polite">{statusMessage}</p>
    </div>
  );
}

function CatalogProductCard({ product, eager, favorited, isAuthenticated, returnTo, scoreLabel, activeConcern }: {
  product: Product;
  eager: boolean;
  favorited: boolean;
  isAuthenticated: boolean;
  returnTo: string;
  scoreLabel: string;
  activeConcern?: string;
}) {
  const imageUrl = resolveProductImageUrl(product.imageUrl);
  const [imageFailed, setImageFailed] = useState(false);

  const concernReason = activeConcern
    ? product.matchReasons?.find((reason) => reason.includes(activeConcern))
    : undefined;

  return (
    <article className={styles.card}>
      <Link href={`/products/${encodeURIComponent(product.id)}`} prefetch={false} className={styles.cardLink}>
        <div className={styles.imageBox}>
          {imageUrl && !imageFailed ? (
            <Image
              src={imageUrl}
              alt={`${product.brand} ${product.name}`}
              fill
              sizes="(max-width: 594px) 33vw, 198px"
              loading={eager ? "eager" : "lazy"}
              className={styles.productImage}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className={styles.imageFallback} role="img" aria-label={`${product.brand} ${product.name} 이미지 준비 중`}>
              <ImageIcon size={22} aria-hidden="true" />
              <span>이미지 준비 중</span>
            </div>
          )}
        </div>
        <div className={styles.copy}>
          <p className={styles.brand}><span>{product.brand}</span><span>{product.category}</span></p>
          <h2>{product.name}</h2>
          <p className={styles.price}>{product.price}</p>
          <p className={styles.score}><strong>{product.score}</strong><span>{scoreLabel}</span></p>
          <p className={styles.benefit}>{concernReason ?? product.benefit}</p>
        </div>
      </Link>
      <div className={styles.favorite}>
        <FavoriteButton
          productId={product.id}
          initialFavorited={favorited}
          isAuthenticated={isAuthenticated}
          returnTo={returnTo}
          small
        />
      </div>
    </article>
  );
}
