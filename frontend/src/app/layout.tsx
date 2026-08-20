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
    default: "화력 — 내 피부에 맞는 화장품 이야기",
    template: "%s | 화력",
  },
  description: "성분과 실사용 리뷰, 내 피부 궁합을 한눈에 살펴보고 나에게 맞는 화장품을 발견하세요.",
  applicationName: "화력 HWA:RYEOK",
  keywords: ["화장품", "성분", "피부 적합도", "화장품 리뷰", "화장품 비교"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "화력 HWA:RYEOK",
    title: "화력 — 내 피부에 맞는 화장품 이야기",
    description: "성분부터 사용감까지, 내 피부에 맞춰 읽는 화장품 이야기",
    url: "/",
    images: [{ url: "/hero-watercolor.png", width: 1200, height: 630, alt: "화력의 매화 수채화 배경" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "화력 — 내 피부에 맞는 화장품 이야기",
    description: "성분과 사용감, 피부 궁합을 한눈에 담은 화력 리포트를 만나보세요.",
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
