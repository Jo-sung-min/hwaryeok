"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ArrowUpRight, Medal } from "lucide-react";
import { ProductVisual } from "@/components/product-ui";
import { ReviewPetalRating } from "@/components/review-petal-rating";
import type { Product } from "@/lib/types";
import styles from "./home-banner.module.css";

export type HomeBannerSlide = {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
  product: Product;
  reviewScore: number | null;
};

const MAX_BANNERS = 10;
const AUTOPLAY_INTERVAL_MS = 3_000;
const TRANSITION_DURATION_MS = 500;
const TRANSITION_FALLBACK_MS = TRANSITION_DURATION_MS + 80;
const CLICK_GUARD_DISTANCE_PX = 8;
const SWIPE_THRESHOLD_RATIO = 0.2;

export function HomeBanner({ slides }: { slides: HomeBannerSlide[] }) {
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const cardsRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const totalRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragAxisRef = useRef<"pending" | "horizontal" | "vertical">("pending");
  const didDragRef = useRef(false);
  const pendingStepRef = useRef(0);
  const shouldAnnounceRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);
  const availableSlides = useMemo(() => {
    const seen = new Set<string>();
    return slides.filter((slide) => {
      if (seen.has(slide.id)) return false;
      seen.add(slide.id);
      return true;
    }).slice(0, MAX_BANNERS);
  }, [slides]);
  const total = availableSlides.length;
  const canMove = total > 1;
  const currentIndex = total > 0 ? index % total : 0;
  indexRef.current = currentIndex;
  totalRef.current = total;

  const finishAnimation = useCallback(() => {
    if (!isAnimatingRef.current) return;
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    const step = pendingStepRef.current;
    const shouldAnnounce = shouldAnnounceRef.current;
    const slideCount = totalRef.current;
    pendingStepRef.current = 0;
    shouldAnnounceRef.current = false;
    isAnimatingRef.current = false;
    dragOffsetRef.current = 0;
    setIsAnimating(false);
    setDragOffset(0);

    if (step === 0 || slideCount < 2) return;
    const next = (indexRef.current + step + slideCount) % slideCount;
    indexRef.current = next;
    setIndex(next);
    if (shouldAnnounce) setAnnouncement(`${slideCount}개 배너 중 ${next + 1}번째입니다.`);
  }, []);

  const animateTo = useCallback((offset: number, step: number, shouldAnnounce: boolean) => {
    if (isAnimatingRef.current) return false;
    pendingStepRef.current = step;
    shouldAnnounceRef.current = shouldAnnounce;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setDragOffset(offset);
    transitionTimerRef.current = window.setTimeout(finishAnimation, TRANSITION_FALLBACK_MS);
    return true;
  }, [finishAnimation]);

  const move = useCallback((step: number, shouldAnnounce = true) => {
    if (totalRef.current < 2 || isDraggingRef.current || isAnimatingRef.current) return;
    const width = cardsRef.current?.clientWidth ?? 0;
    if (width <= 0) return;
    const direction = step < 0 ? -1 : 1;
    animateTo(-direction * width, direction, shouldAnnounce);
  }, [animateTo]);

  useEffect(() => () => {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (!canMove || isDragging || isHovered || isFocusWithin || !isPageVisible || prefersReducedMotion) return;
    const interval = window.setInterval(() => move(1, false), AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [canMove, isDragging, isHovered, isFocusWithin, isPageVisible, move, prefersReducedMotion]);

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canMove || isAnimatingRef.current || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;

    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragOffsetRef.current = 0;
    dragPointerIdRef.current = event.pointerId;
    dragAxisRef.current = "pending";
    didDragRef.current = false;
    isDraggingRef.current = true;
    setDragOffset(0);
    setIsDragging(true);
  }

  function updateDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragPointerIdRef.current !== event.pointerId || dragStartXRef.current === null || dragStartYRef.current === null) return;

    const rawOffset = event.clientX - dragStartXRef.current;
    const verticalOffset = event.clientY - dragStartYRef.current;
    if (dragAxisRef.current === "pending" && Math.max(Math.abs(rawOffset), Math.abs(verticalOffset)) > CLICK_GUARD_DISTANCE_PX) {
      dragAxisRef.current = Math.abs(rawOffset) > Math.abs(verticalOffset) ? "horizontal" : "vertical";
      if (dragAxisRef.current === "horizontal" && !event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
    if (dragAxisRef.current !== "horizontal") {
      dragOffsetRef.current = 0;
      setDragOffset(0);
      return;
    }

    const width = event.currentTarget.clientWidth;
    const nextOffset = Math.max(-width, Math.min(width, rawOffset));
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
    didDragRef.current = true;
    event.preventDefault();
  }

  function finishDrag(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    if (dragPointerIdRef.current !== event.pointerId) return;

    const completedOffset = dragOffsetRef.current;
    const completedAxis = dragAxisRef.current;
    const swipeDistance = event.currentTarget.clientWidth * SWIPE_THRESHOLD_RATIO;
    const hasPointerCapture = event.currentTarget.hasPointerCapture(event.pointerId);
    dragStartXRef.current = null;
    dragStartYRef.current = null;
    dragOffsetRef.current = 0;
    dragPointerIdRef.current = null;
    dragAxisRef.current = "pending";
    isDraggingRef.current = false;
    setIsDragging(false);

    if (event.pointerType === "mouse") {
      const bounds = event.currentTarget.getBoundingClientRect();
      const pointerRemainsInside = event.clientX >= bounds.left && event.clientX <= bounds.right
        && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      setIsHovered(pointerRemainsInside);
    }
    const activeElement = event.currentTarget.ownerDocument.activeElement;
    if (didDragRef.current && activeElement instanceof HTMLElement && event.currentTarget.contains(activeElement)) {
      activeElement.blur();
      setIsFocusWithin(false);
    }

    if (hasPointerCapture) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && completedAxis === "horizontal" && Math.abs(completedOffset) >= swipeDistance) {
      move(completedOffset < 0 ? 1 : -1);
      return;
    }
    if (completedOffset !== 0) {
      animateTo(0, 0, false);
      return;
    }
    setDragOffset(0);
  }

  if (total === 0) return null;

  const trackSlides = canMove ? [-1, 0, 1].map((slot) => {
    const slideIndex = (currentIndex + slot + total) % total;
    return { slide: availableSlides[slideIndex], position: slideIndex + 1, slot };
  }) : [{ slide: availableSlides[0], position: 1, slot: 0 }];
  const trackTransform = canMove
    ? `translate3d(calc(-33.333333% + ${dragOffset}px), 0, 0)`
    : "translate3d(0, 0, 0)";

  return (
    <section
      className={styles.banner}
      aria-label="이주의 화력 랭킹"
      aria-roledescription="캐러셀"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setIsHovered(true); }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") setIsHovered(false); }}
      onFocusCapture={() => setIsFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsFocusWithin(false);
      }}
      onKeyDown={(event) => {
        if (!canMove) return;
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
        if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
      }}
    >
      <div
        ref={cardsRef}
        className={styles.cards}
        data-can-move={canMove}
        data-dragging={isDragging}
        aria-live="off"
        onPointerDown={startDrag}
        onPointerMove={updateDrag}
        onPointerUp={(event) => finishDrag(event)}
        onPointerCancel={(event) => finishDrag(event, true)}
        onLostPointerCapture={(event) => finishDrag(event, true)}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (!didDragRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          didDragRef.current = false;
        }}
      >
        <div
          className={styles.track}
          data-looping={canMove}
          data-dragging={isDragging}
          data-animating={isAnimating}
          style={{ transform: trackTransform }}
          onTransitionEnd={(event) => {
            if (event.target === event.currentTarget && event.propertyName === "transform") finishAnimation();
          }}
        >
          {trackSlides.map(({ slide, position, slot }) => {
            const isCurrent = slot === 0;
            return (
              <article
                key={slot}
                className={styles.card}
                role="group"
                aria-roledescription="슬라이드"
                aria-label={`${total}개 중 ${position}번째`}
                aria-hidden={isCurrent ? undefined : true}
              >
                <Link
                  href={slide.href}
                  className={styles.cardLink}
                  aria-label={`${slide.label} · ${slide.title.replace(/\n/g, " ")} 제품 보기`}
                  tabIndex={isCurrent ? undefined : -1}
                >
                  <div className={styles.image}>
                    <div className={styles.productImage}>
                      <ProductVisual tone={slide.product.tone} imageUrl={slide.product.imageUrl} alt={`${slide.product.brand} ${slide.product.name}`} variant="fill" />
                    </div>
                  </div>
                  <span className={styles.rankBadge} aria-label={`${position}번째 배너`}><Medal size={15} aria-hidden="true" />{position}</span>
                  <span className={styles.slideCounter} aria-hidden="true">{String(position).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
                  <div className={styles.copy}>
                    <span className={styles.label}>{slide.product.brand} · {slide.label}</span>
                    <h2>{slide.product.name}</h2>
                    <p>
                      {slide.reviewScore !== null && <ReviewPetalRating score={slide.reviewScore} label="이주의 리뷰점수" compact />}
                      <span className={styles.descriptionText}>{slide.description}</span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
    </section>
  );
}
