import Link from "next/link";
import { Camera, LayoutDashboard } from "lucide-react";
import styles from "./my.module.css";

export function MyTabs({ active }: { active: "overview" | "photo" }) {
  return <nav className={styles.tabs} aria-label="마이페이지 메뉴"><Link href="/my" aria-current={active === "overview" ? "page" : undefined}><LayoutDashboard size={16} />내 기록</Link><Link href="/my/photo-analysis" aria-current={active === "photo" ? "page" : undefined}><Camera size={16} />사진 피부 분석<span className={styles.aiBadge}>AI</span></Link></nav>;
}
