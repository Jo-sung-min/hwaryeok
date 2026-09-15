import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, SearchCheck, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen pb-28">
      <section className="border-b border-[#eacdd4] bg-[#fff2f5] py-9 md:py-14">
        <div className="container-page">
          <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#78666c]"><ArrowLeft size={16} /> 관리자 센터</Link>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-2">SEARCH &amp; SOCIAL</p>
              <h1 className="font-myeongjo text-3xl font-bold sm:text-4xl">SEO 관리</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#77666c]">검색 결과에 표시할 제목과 설명, SNS 공유 이미지, 검색 노출 여부와 사이트맵 포함 기준을 페이지별로 관리하세요.</p>
            </div>
            <span className="inline-flex self-start items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#954b5f]"><ShieldCheck size={15} /> 관리자 전용</span>
          </div>
        </div>
      </section>

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
