"use client";

import Link from "next/link";
import { ArrowUpRight, AtSign, LoaderCircle, Save } from "lucide-react";
import { useActionState, useState } from "react";
import type { MyReviewerProfile, ReviewerBioBlock } from "@/lib/types";
import { DynamicBlockNote } from "./dynamic-blocknote";
import { saveReviewerProfileAction, type ReviewerProfileActionState } from "./actions";
import styles from "./reviewer-profile.module.css";

const initialActionState: ReviewerProfileActionState = { success: false, message: "", fieldErrors: {} };

export function ReviewerProfileForm({ profile }: { profile: MyReviewerProfile }) {
  const [bioBlocks, setBioBlocks] = useState<ReviewerBioBlock[]>(profile.bioBlocks);
  const [state, formAction, pending] = useActionState(saveReviewerProfileAction, initialActionState);

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="bioBlocks" value={JSON.stringify(bioBlocks)} />

      <section className={styles.formSection} aria-labelledby="reviewer-bio-heading">
        <div className={styles.sectionHeading}>
          <div><p>INTRODUCTION</p><h2 id="reviewer-bio-heading">나를 소개해 주세요</h2></div>
          <span>BlockNote</span>
        </div>
        <p className={styles.help}>피부 취향, 리뷰 기준, 즐겨 쓰는 제품처럼 다른 사용자가 나를 기억할 이야기를 작성해 보세요.</p>
        <div className={styles.editorFrame}>
          <DynamicBlockNote initialContent={profile.bioBlocks} onChange={setBioBlocks} />
        </div>
        {state.fieldErrors.bioBlocks && <p className={styles.fieldError} role="alert">{state.fieldErrors.bioBlocks}</p>}
      </section>

      <section className={styles.formSection} aria-labelledby="reviewer-links-heading">
        <div className={styles.sectionHeading}><div><p>MY CHANNELS</p><h2 id="reviewer-links-heading">내 채널 연결</h2></div></div>
        <p className={styles.help}>작성한 리뷰의 닉네임을 누른 사용자가 공개 소개페이지에서 내 채널을 방문할 수 있어요.</p>
        <label className={styles.field}>
          <span><ArrowUpRight size={15} />블로그 주소</span>
          <input name="blogUrl" type="url" inputMode="url" maxLength={2048} defaultValue={profile.blogUrl ?? ""} placeholder="https://blog.example.com/my-page" aria-invalid={Boolean(state.fieldErrors.blogUrl)} />
          {state.fieldErrors.blogUrl && <small role="alert">{state.fieldErrors.blogUrl}</small>}
        </label>
        <label className={styles.field}>
          <span><AtSign size={15} />Instagram 주소</span>
          <input name="instagramUrl" type="url" inputMode="url" maxLength={2048} defaultValue={profile.instagramUrl ?? ""} placeholder="https://www.instagram.com/my-account" aria-invalid={Boolean(state.fieldErrors.instagramUrl)} />
          {state.fieldErrors.instagramUrl && <small role="alert">{state.fieldErrors.instagramUrl}</small>}
        </label>
      </section>

      <div className={styles.actions}>
        <div>
          <p className={state.success ? styles.success : styles.error} role="status" aria-live="polite">{state.message}</p>
          {state.success && <Link href={`/reviewers/${encodeURIComponent(profile.userId)}`}>공개 소개페이지 확인 <ArrowUpRight size={13} /></Link>}
        </div>
        <button type="submit" className="ink-btn" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
          {pending ? "저장 중" : "소개 저장"}
        </button>
      </div>
    </form>
  );
}
