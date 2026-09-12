import Link from "next/link";
import { LogIn, ShieldCheck, UserRound } from "lucide-react";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./navigation.module.css";

function KakaoTalkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.85 5.34 4.65 6.75l-.94 3.48a.46.46 0 0 0 .7.5l4.15-2.75c.47.06.95.09 1.44.09 5.52 0 10-3.59 10-8.07S17.52 3 12 3Z" />
    </svg>
  );
}

export async function HeaderAuth() {
  const user = await getCurrentSession();
  if (!user) {
    return <Link href="/login" className={styles.authLink}><LogIn size={16} aria-hidden="true" /> 로그인</Link>;
  }
  if (user.role === "ADMIN") {
    return <Link href="/admin" className={styles.authLink}><ShieldCheck size={16} aria-hidden="true" /><span>관리</span></Link>;
  }
  if (user.authMethod.toLowerCase() === "kakao") {
    return (
      <Link href="/skin-check" aria-label="카카오 계정 나의 성분찾기" className={`${styles.authLink} ${styles.kakaoAuthLink}`}>
        <span className={styles.kakaoBadge} aria-hidden="true"><KakaoTalkIcon /></span>
        <span className={styles.kakaoLabel}>카카오</span>
      </Link>
    );
  }
  return <Link href="/skin-check" className={styles.authLink}><UserRound size={16} aria-hidden="true" /><span>{user.nickname}</span></Link>;
}
