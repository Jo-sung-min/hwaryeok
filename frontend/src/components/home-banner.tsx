"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { ProductVisual } from "@/components/product-ui";
import type { Product } from "@/lib/types";
import styles from "./home-banner.module.css";

export type HomeBannerSlide = {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
  product: Product;
};

const MAX_BANNERS = 10;
const AUTOPLAY_INTERVAL_MS = 5_000;
const TABLET_QUERY = "(min-width: 768px)";
const DESKTOP_QUERY = "(min-width: 1100px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToViewport(onChange: () => void) {
  const queries = [window.matchMedia(TABLET_QUERY), window.matchMedia(DESKTOP_QUERY)];
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => queries.forEach((query) => query.removeEventListener("change", onChange));
}

function getVisibleCardCount() {
  if (window.matchMedia(DESKTOP_QUERY).matches) return 3;
  return window.matchMedia(TABLET_QUERY).matches ? 2 : 1;
}

function subscribeToMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

export function HomeBanner({ slides }: { slides: HomeBannerSlide[] }) {
  const carouselId = useId();
  const [index, setIndex] = useState(0);
  const [playbackOverride, setPlaybackOverride] = useState<boolean | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const visibleCardCount = useSyncExternalStore(subscribeToViewport, getVisibleCardCount, () => 3);
  const reducedMotion = useSyncExternalStore(subscribeToMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches, () => true);
  const isDocumentVisible = useSyncExternalStore(subscribeToVisibility,
    () => document.visibilityState === "visible", () => false);
  const availableSlides = useMemo(() => {
    const seen = new Set<string>();
    return slides.filter((slide) => {
      if (seen.has(slide.id)) return false;
      seen.add(slide.id);
      return true;
    }).slice(0, MAX_BANNERS);
  }, [slides]);
  const total = availableSlides.length;
  const canMove = total > visibleCardCount;
  const currentIndex = total > 0 && canMove ? index % total : 0;
  const visibleSlides = Array.from({ length: Math.min(total, visibleCardCount) }, (_, offset) => ({
    slide: availableSlides[(currentIndex + offset) % total],
    position: (currentIndex + offset) % total + 1,
  }));
  const wantsAutoplay = playbackOverride ?? !reducedMotion;
  const isPlaying = canMove && wantsAutoplay && !isHovered && !hasFocus && isDocumentVisible;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => setIndex((previous) => (previous + 1) % total), AUTOPLAY_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [isPlaying, currentIndex, total]);

  function move(step: number) {
    const next = (currentIndex + step + total) % total;
    setIndex(next);
    setAnnouncement(`${total}개 배너 중 ${next + 1}번째부터 ${Math.min(total, visibleCardCount)}개를 보여드려요.`);
  }

  if (total === 0) return null;

  return (
    <section
      className={styles.banner}
      aria-label="화력 성분 가이드"
      aria-roledescription="캐러셀"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setIsHovered(true); }}
      onPointerLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
      }}
    >
      <div id={carouselId} className={styles.cards} data-count={Math.min(total, 3)} aria-live="off">
        {visibleSlides.map(({ slide, position }) => (
          <article key={slide.id} className={styles.card} role="group" aria-roledescription="슬라이드" aria-label={`${total}개 중 ${position}번째`}>
            <Link href={slide.href} className={styles.cardLink} aria-label={`${slide.label} · ${slide.title.replace(/\n/g, " ")} 제품 보기`}>
              <div className={styles.image}>
                <div className={styles.productImage}>
                  <ProductVisual tone={slide.product.tone} imageUrl={slide.product.imageUrl} alt={`${slide.product.brand} ${slide.product.name}`} variant="fill" />
                </div>
              </div>
              <div className={styles.copy}>
                <span className={styles.label}>{slide.label}</span>
                <h2>{slide.title}</h2>
                <p><span className={styles.descriptionText}>{slide.description}</span><ArrowUpRight size={15} aria-hidden="true" /></p>
              </div>
            </Link>
          </article>
        ))}
      </div>
      {canMove && (
        <div className={styles.controls}>
          <span className={styles.counter} aria-label={`${total}개 배너 중 ${currentIndex + 1}번째부터 표시 중`}>
            <strong>{String(currentIndex + 1).padStart(2, "0")}</strong><span aria-hidden="true"> / </span>{String(total).padStart(2, "0")}
          </span>
          <div className={styles.buttons}>
            <button type="button" aria-label="이전 배너" aria-controls={carouselId} onClick={() => move(-1)}><ChevronLeft size={18} aria-hidden="true" /></button>
            <button type="button" aria-label={wantsAutoplay ? "배너 자동 넘김 일시정지" : "배너 자동 넘김 재생"} aria-controls={carouselId}
              onClick={() => { setPlaybackOverride(!wantsAutoplay); setAnnouncement(wantsAutoplay ? "자동 넘김을 일시정지했어요." : "배너 밖으로 이동하면 자동 넘김이 시작돼요."); }}>
              {wantsAutoplay ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
            </button>
            <button type="button" aria-label="다음 배너" aria-controls={carouselId} onClick={() => move(1)}><ChevronRight size={18} aria-hidden="true" /></button>
          </div>
        </div>
      )}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
    </section>
  );
}
