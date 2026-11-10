import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchCheck } from "lucide-react";
import { AdminHeader } from "@/app/admin/admin-ui";
import { getAdminSeoPages } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";
import { SEO_PAGE_FALLBACKS, SEO_PAGE_KEYS, seoPageFallback } from "@/lib/seo";
import { SeoPageForm } from "./seo-page-form";

export const metadata: Metadata = {
  title: { absolute: "SEO 관리 | 화력" },
  description: "화력 관리자용 페이지별 검색 노출 및 SNS 공유 설정 화면입니다.",
  alternates: { canonical: "/admin/seo" },
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "화력 HWA:RYEOK",
    title: "SEO 관리 | 화력",
    description: "화력 관리자용 페이지별 검색 노출 및 SNS 공유 설정 화면입니다.",
    url: "/admin/seo",
    images: [{ url: "/hero-watercolor.png", alt: "화력 SEO 관리" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SEO 관리 | 화력",
    description: "화력 관리자용 페이지별 검색 노출 및 SNS 공유 설정 화면입니다.",
    images: ["/hero-watercolor.png"],
  },
};

export default async function AdminSeoPage() {
  const user = await requireSession("/admin/seo");
  if (user.role !== "ADMIN") notFound();
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();

  const pages = await getAdminSeoPages(accessToken).catch((error) => recoverAdminPageSession(error, "/admin/seo"));
  const pageByKey = new Map(pages.map((page) => [page.pageKey, page]));
  const managedPages = SEO_PAGE_KEYS.map((pageKey) => {
    const remotePage = pageByKey.get(pageKey);
    const fallbackPage = SEO_PAGE_FALLBACKS[pageKey];
    return remotePage
      ? { ...fallbackPage, ...remotePage, pageKey, path: fallbackPage.path, displayName: fallbackPage.displayName }
      : seoPageFallback(pageKey);
  });

  return (
    <div>
      <AdminHeader title="SEO" />

      <main className="container-page py-8 md:py-12">
        <aside className="mb-7 flex gap-3 rounded-[22px] border border-[#e5d4da] bg-white p-5 text-xs leading-6 text-[#79676e]">
          <SearchCheck size={19} className="mt-0.5 shrink-0 text-[#aa506c]" />
          <p>제목은 입력한 문구 그대로 브라우저와 검색 결과에 사용됩니다. 검색 노출을 끄면 해당 페이지에 <strong>noindex</strong>가 적용되고 사이트맵에서도 자동으로 빠집니다. 저장 후 공개 화면과 사이트맵에 즉시 반영돼요.</p>
        </aside>

        <div className="grid gap-4">
          {managedPages.map((page) => <SeoPageForm key={page.pageKey} page={page} />)}
        </div>
      </main>
    </div>
  );
}
