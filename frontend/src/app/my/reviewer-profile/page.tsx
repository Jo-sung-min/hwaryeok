import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Megaphone } from "lucide-react";
import { getMyReviewerProfile } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";
import { normalizeReviewerBioBlocks } from "@/lib/reviewer-profile";
import { ReviewerProfileForm } from "./reviewer-profile-form";
import styles from "./reviewer-profile.module.css";

export const metadata = { title: "내 리뷰어 소개 관리", robots: { index: false, follow: false } };

export default async function MyReviewerProfilePage() {
  const returnTo = "/my/reviewer-profile";
  const user = await requireSession(returnTo);
  const { accessToken } = await readAuthTokens();
  if (!accessToken) return null;
  const profile = await getMyReviewerProfile(accessToken).catch((error) => recoverAdminPageSession(error, returnTo));
  const safeProfile = { ...profile, bioBlocks: normalizeReviewerBioBlocks(profile.bioBlocks) };

  return (
    <div className={styles.page}>
      <Link href="/my" className={styles.back}><ArrowLeft size={16} />마이 화력</Link>
      <header className={styles.header}>
        <div className={styles.headerIcon} aria-hidden="true"><Megaphone size={25} /></div>
        <div className={styles.headerCopy}>
          <p>MY REVIEWER PAGE</p>
          <h1>{user.nickname}님의 리뷰어 소개</h1>
          <span>좋은 리뷰가 내 채널과 취향을 알리는 포트폴리오가 되도록 꾸며보세요.</span>
        </div>
        <Link href={`/reviewers/${encodeURIComponent(user.id)}`} className={styles.publicLink}>공개페이지 <ArrowUpRight size={14} /></Link>
      </header>
      <div className={styles.notice}>리뷰를 작성하면 제품 페이지의 닉네임과 리뷰어 랭킹에서 이 소개페이지로 연결돼요.</div>
      <ReviewerProfileForm profile={safeProfile} />
    </div>
  );
}
