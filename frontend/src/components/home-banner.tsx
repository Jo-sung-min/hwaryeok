"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductVisual } from "@/components/product-ui";
import type { Product } from "@/lib/types";
import styles from "./home-catalog.module.css";

export type HomeBannerSlide = {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
  product: Product;
};

export function HomeBanner({ slides }: { slides: HomeBannerSlide[] }) {
  const [index, setIndex] = useState(0);
  if (slides.length === 0) return null;
  const current = index % slides.length;
  const slide = slides[current];
  const move = (step: number) => setIndex((previous) => (previous + step + slides.length) % slides.length);

  return (
    <section className={styles.banner} aria-label="화력 성분 가이드 배너" aria-roledescription="캐러셀">
      <div id="home-banner-slide" aria-live="polite" aria-atomic="true">
        <Link href={slide.href} className={styles.bannerLink} aria-label={`${slide.title.replace(/\n/g, " ")} 제품 보기`}>
          <div className={styles.bannerCopy}>
            <span className={styles.bannerLabel}>{slide.label}</span>
            <h2>{slide.title}</h2>
            <p>{slide.description}</p>
            <span className={styles.bannerCta}>제품 만나보기 <ArrowRight size={16} /></span>
          </div>
          <div className={styles.bannerImage}>
            <ProductVisual tone={slide.product.tone} imageUrl={slide.product.imageUrl} alt={`${slide.product.brand} ${slide.product.name}`} variant="fill" />
          </div>
        </Link>
      </div>
      {slides.length > 1 && <div className={styles.bannerControls}>
        <button type="button" aria-label="이전 배너" aria-controls="home-banner-slide" onClick={() => move(-1)}><ChevronLeft size={16} /></button>
        <span aria-label={`${slides.length}개 중 ${current + 1}번째 배너`}><strong>{current + 1}</strong> / {slides.length}</span>
        <button type="button" aria-label="다음 배너" aria-controls="home-banner-slide" onClick={() => move(1)}><ChevronRight size={16} /></button>
      </div>}
    </section>
  );
}
