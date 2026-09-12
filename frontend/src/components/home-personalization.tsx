"use client";

import Link from "next/link";
import { ArrowRight, Pencil, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import type { AuthUser, SkinProfile } from "@/lib/api";
import { homeDisplayMode } from "@/lib/home-catalog";
import { homeSkinSummaryHref } from "@/lib/home-personalization";
import { SKIN_CHECK_DRAFT_KEY, restoreSkinDraftSummary } from "@/lib/skin-check";
import { skinTendencyAssetKey } from "@/lib/skin-tendency-assets";
import styles from "./home-personalization.module.css";

type QuickSkinSummary = { skinType: string; hasReport: boolean };

export function HomePersonalization({ user, profile }: { user: AuthUser | null; profile: SkinProfile | null }) {
  const mode = homeDisplayMode(Boolean(user), Boolean(profile?.configured));
  const personalized = mode === "personalized";
  const savedSkinType = personalized ? profile?.skinType?.trim() || null : null;
  const [quickSummary, setQuickSummary] = useState<QuickSkinSummary | null>(null);

  useEffect(() => {
    try {
      setQuickSummary(restoreSkinDraftSummary(
        window.sessionStorage.getItem(SKIN_CHECK_DRAFT_KEY),
        Date.now(),
        user?.id ?? null,
        profile?.updatedAt ?? null,
      ));
    } catch {
      setQuickSummary(null);
    }
  }, [profile?.updatedAt, user?.id]);

  const hasQuickSummary = Boolean(quickSummary);
  const hasGeneratedReport = quickSummary?.hasReport === true;
  const showQuickSummary = hasGeneratedReport || (!personalized && hasQuickSummary);
  const skinType = showQuickSummary ? quickSummary?.skinType ?? null : savedSkinType;
  const hasSkinResult = personalized || hasQuickSummary;
  const displayMode = showQuickSummary ? "quick-result" : mode;
  const editHref = homeSkinSummaryHref(hasGeneratedReport, personalized);
  const skinAsset = skinTendencyAssetKey(skinType);

  return (
    <section className={styles.panel} aria-labelledby="home-personalization-title" data-personalization={displayMode}>
      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span>나를 기준으로, 화력</span>
        </div>
        <h2 id="home-personalization-title">
          다른 사람의 1위보다,<br /> 내 피부에 맞는 1위
        </h2>
      </div>

      {hasSkinResult ? (
        <Link
          href={editHref}
          className={styles.profileSummary}
          aria-label={hasGeneratedReport
            ? `${skinType ? `${skinType} 경향` : "내 피부"} 리포트 보기, 리포트에서 답변 수정 가능`
            : `${skinType ? `${skinType} 경향` : "내 피부"} 설정 수정`}
        >
          <span className={styles.emblem} aria-hidden="true">
            <span className={styles.tendencyAsset} data-skin-asset={skinAsset} />
          </span>
          <span className={styles.profileCopy}>
            <small>{showQuickSummary ? "이번 성분찾기 결과" : "저장된 피부 타입"}</small>
            <strong>{skinType ? `${skinType} 경향` : "피부 설정 완료"}</strong>
          </span>
          <span className={styles.editLabel}><Pencil size={12} aria-hidden="true" />수정</span>
        </Link>
      ) : (
        <div className={styles.setup}>
          <p>{mode === "guest" ? "피부 답변으로 내 피부 타입과 성분을 함께 찾아보세요." : "나의 성분찾기 결과를 계정에 저장할 수 있어요."}</p>
          <Link href="/skin-check" className={styles.primary}>
            나의 성분찾기<ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
