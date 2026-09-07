import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { BottomNav, Header } from "@/components/navigation";
import { HeaderAuth } from "@/components/header-auth";
import { UiAlertProvider } from "@/components/ui-alert-provider";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "화력 — 나에게 맞는 성분, 화장품 랭킹",
    template: "%s | 화력",
  },
  description: "히알루론산부터 세라마이드까지, 나에게 맞는 성분을 고르고 앰플·크림·토너의 성분별 랭킹과 사용자 리뷰를 확인하세요.",
  applicationName: "화력 HWA:RYEOK",
  keywords: ["화장품 랭킹", "성분 랭킹", "히알루론산", "세라마이드", "화장품 리뷰", "화장품 비교"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "화력 HWA:RYEOK",
    title: "화력 — 나에게 맞는 성분, 화장품 랭킹",
    description: "성분과 제품 종류를 고르고, 성분 화력과 사용자 리뷰를 함께 살펴보세요.",
    url: "/",
    images: [{ url: "/hero-watercolor.png", width: 1200, height: 630, alt: "화력의 매화 수채화 배경" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "화력 — 나에게 맞는 성분, 화장품 랭킹",
    description: "성분과 제품 종류를 고르고, 성분 화력과 사용자 리뷰를 함께 살펴보세요.",
    images: ["/hero-watercolor.png"],
  },
};

function siteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <UiAlertProvider>
          <Header authSlot={<Suspense fallback={<span className="line-btn !min-h-10 !w-24 opacity-50" aria-hidden="true" />}><HeaderAuth /></Suspense>} />
          <main>{children}</main>
          <Footer />
          <BottomNav />
        </UiAlertProvider>
      </body>
    </html>
  );
}
