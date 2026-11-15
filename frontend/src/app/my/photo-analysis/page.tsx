import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireSession, readAuthTokens } from "@/lib/auth-session";
import { getSkinPhotoStatus } from "@/lib/api";
import { MyTabs } from "../my-tabs";
import { SkinPhotoForm } from "./skin-photo-form";
import styles from "../my.module.css";

export const metadata = { title: "사진 피부 분석 | 마이화력", robots: { index: false, follow: false } };

export default async function SkinPhotoPage() {
  const user = await requireSession("/my/photo-analysis");
  const { accessToken } = await readAuthTokens();
  const status = accessToken ? await getSkinPhotoStatus(accessToken).catch(() => null) : null;
  return <div className={styles.page}><header className={styles.header}><Link href="/my" className={styles.iconButton} aria-label="마이페이지로 돌아가기"><ChevronLeft size={20} /></Link><div className={styles.identity}><h1>사진 피부 분석</h1></div></header><MyTabs active="photo" /><SkinPhotoForm initialStatus={status} /></div>;
}
