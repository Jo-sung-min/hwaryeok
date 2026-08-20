import type { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth-session";
import { QuickSkinCheck } from "./quick-skin-check";

export const metadata: Metadata = {
  title: "1분 피부 체크",
  description: "로그인 없이 피부 상태를 체크하고 성분 근거 중심의 맞춤 제품을 미리 확인하세요.",
  alternates: { canonical: "/skin-check" },
};

export default async function SkinCheckPage() {
  const user = await getCurrentSession();
  return <QuickSkinCheck isAuthenticated={Boolean(user)} />;
}
