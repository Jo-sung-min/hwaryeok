"use client";

import Link from "next/link";
import { ArrowRight, Droplets, Flower2, Pencil, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import type { AuthUser, SkinProfile } from "@/lib/api";
import { homeDisplayMode } from "@/lib/home-catalog";
import { SKIN_CHECK_DRAFT_KEY, restoreSkinDraft, toQuickProfile } from "@/lib/skin-check";
import styles from "./home-personalization.module.css";

export function HomePersonalization({ user, profile }: { user: AuthUser | null; profile: SkinProfile | null }) {
  const mode = homeDisplayMode(Boolean(user), Boolean(profile?.configured));
  const personalized = mode === "personalized";
  const savedSkinType = personalized ? profile?.skinType?.trim() || null : null;
  const [quickSkinType, setQuickSkinType] = useState<string | null>(null);

  useEffect(() => {
    if (personalized) return;
    try {
      const draft = restoreSkinDraft(window.sessionStorage.getItem(SKIN_CHECK_DRAFT_KEY));
      setQuickSkinType(draft ? toQuickProfile(draft.answers)?.skinType ?? null : null);
    } catch {
      setQuickSkinType(null);
    }
  }, [personalized]);

  const skinType = savedSkinType ?? quickSkinType;
  const hasSkinResult = personalized || Boolean(quickSkinType);
  const displayMode = quickSkinType && !personalized ? "quick-result" : mode;
  const editHref = personalized ? "/profile?edit=1" : "/skin-check?step=review";

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
          aria-label={`${skinType ? `${skinType} 경향` : "내 피부"} 설정 수정`}
        >
          <span className={styles.emblem} aria-hidden="true">
            <Flower2 size={29} strokeWidth={1.45} />
            <span><Droplets size={13} /></span>
          </span>
          <span className={styles.profileCopy}>
            <small>{personalized ? "저장된 피부 타입" : "이번 피부 체크"}</small>
            <strong>{skinType ? `${skinType} 경향` : "피부 설정 완료"}</strong>
          </span>
          <span className={styles.editLabel}><Pencil size={12} aria-hidden="true" />수정</span>
        </Link>
      ) : (
        <div className={styles.setup}>
          <p>{mode === "guest" ? "1분 체크로 내 피부 기준을 찾아보세요." : "피부 체크 후 결과를 저장할 수 있어요."}</p>
          <Link href="/skin-check" className={styles.primary}>
            나의 성분 찾기<ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
