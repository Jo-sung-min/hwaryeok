"use client";

import Link from "next/link";
import { Camera, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { SkinProfile } from "@/lib/api";
import { SKIN_CHECK_DRAFT_KEY, restoreSkinDraftSummary } from "@/lib/skin-check";
import styles from "./my.module.css";

type QuickSkinSummary = { skinType: string; hasReport: boolean };
type PendingQuickSkinSummary = QuickSkinSummary | null | undefined;

export type MySkinSummaryState =
  | { kind: "checking"; title: string; badge: string; description: string; href: null; action: null }
  | { kind: "unavailable" | "empty" | "review" | "result"; title: string; badge: string; description: string; href: string; action: string }
  | { kind: "saved"; title: string; badge: string; description: string; href: string; action: string };

export function resolveMySkinSummaryState(
  profile: SkinProfile | null,
  quickSummary: PendingQuickSkinSummary,
): MySkinSummaryState {
  if (profile === null) {
    return {
      kind: "unavailable",
      title: "피부 정보를 불러오지 못했어요",
      badge: "연결 확인",
      description: "잠시 후 다시 불러오면 저장된 피부 정보를 확인할 수 있어요.",
      href: "/my",
      action: "다시 불러오기",
    };
  }

  if (quickSummary?.hasReport) {
    return {
      kind: "result",
      title: `${quickSummary.skinType} 경향`,
      badge: "이번 결과",
      description: "완료한 피부 체크 결과가 있어요. 추천 성분과 답변을 다시 확인할 수 있어요.",
      href: "/skin-check?step=result",
      action: "나의 피부 결과 보기",
    };
  }

  if (profile.configured) {
    return {
      kind: "saved",
      title: `${profile.skinType?.trim() || "등록된 피부"} 경향`,
      badge: "답변 기반",
      description: "직접 알려주신 피부 상태를 맞춤 순위에 반영해요.",
      href: "/skin-check",
      action: "다시 체크",
    };
  }

  if (quickSummary) {
    return {
      kind: "review",
      title: "피부 답변을 모두 작성했어요",
      badge: "작성 완료",
      description: "답변을 확인하면 피부 타입과 추천 성분 결과를 이어서 볼 수 있어요.",
      href: "/skin-check?step=review",
      action: "답변 확인하기",
    };
  }

  if (quickSummary === undefined) {
    return {
      kind: "checking",
      title: "피부 체크 기록을 확인하고 있어요",
      badge: "확인 중",
      description: "저장된 결과와 이번 피부 체크 기록을 연결하고 있어요.",
      href: null,
      action: null,
    };
  }

  return {
    kind: "empty",
    title: "아직 나의 피부를 모르겠다면",
    badge: "답변 기반",
    description: "피부 체크를 완료하면 피부 타입과 추천 성분을 이곳에서 확인할 수 있어요.",
    href: "/skin-check",
    action: "나의 피부 체크 시작",
  };
}

export function MySkinSummary({ profile, userId }: { profile: SkinProfile | null; userId: string }) {
  const [quickSummary, setQuickSummary] = useState<PendingQuickSkinSummary>(undefined);

  useEffect(() => {
    try {
      setQuickSummary(restoreSkinDraftSummary(
        window.sessionStorage.getItem(SKIN_CHECK_DRAFT_KEY),
        Date.now(),
        userId,
        profile?.updatedAt ?? null,
      ));
    } catch {
      setQuickSummary(null);
    }
  }, [profile?.updatedAt, userId]);

  const state = resolveMySkinSummaryState(profile, quickSummary);
  const details = profile?.configured && state.kind === "saved" ? [
    ["수분감", label(profile.hydrationLevel, { LOW: "부족한 편", BALANCED: "보통", HIGH: "충분한 편" })],
    ["유분감", label(profile.oilinessLevel, { LOW: "적은 편", BALANCED: "보통", HIGH: "많은 편" })],
    ["민감 반응", label(profile.sensitivityLevel, { LOW: "드문 편", MEDIUM: "가끔", HIGH: "잦은 편" })],
    ["트러블", label(profile.breakoutFrequency, { RARE: "드문 편", OCCASIONAL: "가끔", FREQUENT: "잦은 편" })],
  ] : [];

  return (
    <section className={styles.section} aria-labelledby="my-skin-summary-title">
      <div className={styles.sectionHead}>
        <h2 id="my-skin-summary-title">내 피부 요약</h2>
        {state.href && <Link href={state.href}>{state.action}<ChevronRight size={14} /></Link>}
      </div>
      <div className={styles.skinCard} aria-live="polite">
        <div className={styles.sectionHead}>
          <strong className={styles.skinTitle}>{state.title}</strong>
          <span className={styles.badge}>{state.badge}</span>
        </div>
        <p className={styles.muted}>{state.description}</p>
        {state.kind === "saved" && profile?.configured ? (
          <>
            <dl className={styles.metrics}>{details.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
            <div className={styles.tags}>{profile.concerns.map(concern => <span key={concern}>{concern}</span>)}</div>
            {profile.updatedAt && <p className={styles.note}>최근 저장 {new Date(profile.updatedAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} · 측정·의료 진단이 아닌 자가 체크예요.</p>}
          </>
        ) : state.href && (
          <Link className={styles.primaryLink} href={state.href}>{state.action}<ChevronRight size={15} /></Link>
        )}
      </div>
      <Link href="/my/photo-analysis" className={styles.photoLink}>
        <span className={styles.cameraIcon}><Camera size={22} /></span>
        <span><strong>사진으로 피부 살펴보기</strong><small>사진으로 확인하는 피부 표면 관찰 리포트</small></span>
        <ChevronRight size={18} />
      </Link>
    </section>
  );
}

function label(value: string | null | undefined, labels: Record<string, string>) {
  return value ? labels[value] ?? "미등록" : "미등록";
}
