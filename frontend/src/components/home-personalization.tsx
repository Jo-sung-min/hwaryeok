import Link from "next/link";
import { ArrowRight, Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import type { AuthUser, SkinProfile } from "@/lib/api";
import { homeDisplayMode } from "@/lib/home-catalog";
import { homeSkinProfileChips } from "@/lib/home-personalization";
import styles from "./home-personalization.module.css";

export function HomePersonalization({ user, profile }: { user: AuthUser | null; profile: SkinProfile | null }) {
  const mode = homeDisplayMode(Boolean(user), Boolean(profile?.configured));
  const personalized = mode === "personalized";
  const chips = personalized ? homeSkinProfileChips(profile) : [];

  return (
    <section className={styles.panel} aria-labelledby="home-personalization-title" data-personalization={mode}>
      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span>{personalized ? "내 피부 설정" : "나를 기준으로, 화력"}</span>
          {personalized && <span className={styles.applied}><Check size={12} aria-hidden="true" /> 적용 중</span>}
        </div>
        <h2 id="home-personalization-title">
          {personalized ? "내 피부가, 랭킹의 기준이 돼요" : <>다른 사람의 1위보다,<br className={styles.mobileBreak} /> 내 피부에 맞는 1위</>}
        </h2>
        {personalized ? (
          <>
            <p className={styles.description}>저장한 피부 상태와 성분 정보를 반영한 맞춤 화력순으로 보여드려요.</p>
            {chips.length > 0 && (
              <ul className={styles.chips} aria-label="저장된 내 피부 설정">
                {chips.map((chip) => <li key={chip.label}><span className="sr-only">{chip.label}: </span>{chip.value}</li>)}
              </ul>
            )}
          </>
        ) : (
          <p className={styles.description}>
            {mode === "guest" ? "로그인 없이 피부 상태를 체크하고, 나에게 맞는 제품을 먼저 살펴보세요." : "아직 저장된 피부 설정이 없어요. 피부 체크 후 저장하면 나만의 순서가 시작돼요."}
          </p>
        )}
        <details className={styles.explanation}>
          <summary>맞춤 화력은 어떻게 정하나요? <ChevronDown size={13} aria-hidden="true" /></summary>
          <p>피부 타입과 수분·유분·민감도, 고민을 제품의 성분 정보와 함께 반영해요. 리뷰점수나 광고 추천점수와는 별개의 비교 지표이며, 개인별 효과를 보장하지 않아요.</p>
          {!personalized && <p>{mode === "guest" ? "피부 체크는 로그인 없이 이용할 수 있어요. 로그인 후 결과를 확인하고 저장하면" : "피부 체크 결과를 확인하고 저장하면"} 메인 상품과 랭킹에 같은 기준이 적용돼요.</p>}
        </details>
      </div>
      <div className={styles.actions}>
        <Link href={personalized ? "/ranking/personal" : "/skin-check"} className={styles.primary}>
          {personalized ? "내 맞춤 랭킹 보기" : "나의 성분 찾기"}<ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link href={personalized ? "/profile" : "/ranking"} className={styles.secondary}>
          {personalized ? "피부 설정 수정" : "성분 직접 고르기"}
        </Link>
      </div>
    </section>
  );
}
