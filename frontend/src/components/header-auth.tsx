import Link from "next/link";
import { LogIn, ShieldCheck, UserRound } from "lucide-react";
import { getCurrentSession } from "@/lib/auth-session";
import styles from "./navigation.module.css";

export async function HeaderAuth() {
  const user = await getCurrentSession();
  if (!user) {
    return <Link href="/login" className={styles.authLink}><LogIn size={16} aria-hidden="true" /> 로그인</Link>;
  }
  if (user.role === "ADMIN") {
    return <Link href="/admin" className={styles.authLink}><ShieldCheck size={16} aria-hidden="true" /><span>관리</span></Link>;
  }
  return <Link href="/profile" className={styles.authLink}><UserRound size={16} aria-hidden="true" /><span>{user.nickname}</span></Link>;
}
