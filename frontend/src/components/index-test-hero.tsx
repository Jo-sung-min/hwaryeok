import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, Droplets, Sparkles } from "lucide-react";
import { INDEX_TEST_ASSETS } from "@/lib/index-test-assets";
import styles from "./index-test-hero.module.css";

export function IndexTestHero() {
  return (
    <section className={styles.hero} aria-labelledby="indextest-hero-title">
      <Image
        src={INDEX_TEST_ASSETS.hero}
        alt="투명한 세럼과 토너, 크림이 물빛 위에 놓인 화력 스킨케어 비주얼"
        fill
        loading="eager"
        fetchPriority="high"
        sizes="(max-width: 594px) calc(100vw - 24px), 570px"
        className={styles.image}
      />
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.kicker}><Sparkles size={13} aria-hidden="true" /> HWARYEOK SKIN EDIT</p>
        <h1 id="indextest-hero-title">내 피부가 고르는<br />오늘의 화장품.</h1>
        <p className={styles.description}>피부 타입과 주요 성분, 실제 리뷰를 연결해<br />나에게 맞는 선택부터 보여드려요.</p>
        <div className={styles.actions}>
          <Link href="/skin-check" className={styles.primary}>나의 성분 찾기 <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link href="/ranking" className={styles.secondary}>랭킹 보기</Link>
        </div>
        <ul className={styles.signals} aria-label="화력 추천 기준">
          <li><Droplets size={13} aria-hidden="true" />피부 타입</li>
          <li><Sparkles size={13} aria-hidden="true" />주요 성분</li>
          <li><BarChart3 size={13} aria-hidden="true" />실제 리뷰</li>
        </ul>
      </div>
    </section>
  );
}
