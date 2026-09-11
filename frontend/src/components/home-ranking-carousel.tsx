"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import carouselStyles from "./home-ranking-carousel.module.css";

const ITEMS_PER_PAGE = 2;

export function HomeRankingCarousel({
  children,
  itemCount,
  label,
  listClassName,
  ordered = false,
  previewLimit,
}: {
  children: ReactNode;
  itemCount: number;
  label: string;
  listClassName?: string;
  ordered?: boolean;
  previewLimit: number;
}) {
  const viewportRef = useRef<HTMLOListElement | HTMLDivElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const trackId = useId();
  const visibleItemCount = Math.min(itemCount, previewLimit);
  const pageCount = Math.max(1, Math.ceil(visibleItemCount / ITEMS_PER_PAGE));
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  useEffect(() => () => {
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  function goToPage(nextPage: number) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const boundedPage = Math.max(0, Math.min(pageCount - 1, nextPage));
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollTo({
      left: pageCount > 1 ? maxScroll * boundedPage / (pageCount - 1) : 0,
    });
    setPage(boundedPage);
  }

  function syncPageFromScroll() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(() => {
      const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const nextPage = maxScroll > 0 ? Math.round(viewport.scrollLeft / maxScroll * (pageCount - 1)) : 0;
      setPage(nextPage);
      scrollFrameRef.current = null;
    });
  }

  const viewportClassName = [carouselStyles.viewport, listClassName].filter(Boolean).join(" ");
  const viewportProps = {
    className: viewportClassName,
    id: trackId,
    onScroll: syncPageFromScroll,
    tabIndex: 0,
  };

  return <div
    className={carouselStyles.carousel}
    role="region"
    aria-roledescription="carousel"
    aria-label={label}
    data-ranking-carousel
    data-items-per-page="2"
    data-preview-limit={previewLimit}
  >
    {ordered
      ? <ol {...viewportProps} ref={(element) => { viewportRef.current = element; }}>{children}</ol>
      : <div {...viewportProps} ref={(element) => { viewportRef.current = element; }} role="list">{children}</div>}
    {pageCount > 1 && <div className={carouselStyles.controls} aria-label={`${label} 슬라이드 이동`}>
      <button type="button" onClick={() => goToPage(page - 1)} disabled={page === 0} aria-controls={trackId} aria-label={`${label} 이전 2개`}>
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      <p aria-live="polite" aria-atomic="true"><span aria-hidden="true"><strong>{page + 1}</strong> / {pageCount}</span><span className="sr-only">총 {pageCount}페이지 중 {page + 1}페이지</span></p>
      <button type="button" onClick={() => goToPage(page + 1)} disabled={page === pageCount - 1} aria-controls={trackId} aria-label={`${label} 다음 2개`}>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>}
  </div>;
}
