import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { BottomNav, Header } from "@/components/navigation";
import { HeaderAuth } from "@/components/header-auth";
import { UiAlertProvider } from "@/components/ui-alert-provider";

export const metadata: Metadata = {
  title: "화력 — 광고보다 기준으로 보는 화장품",
  description: "성분 구성, 실사용 리뷰, 내 피부 적합도와 데이터 상태를 한 장의 화력 판정서로 확인하세요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <UiAlertProvider>
          <Header authSlot={<Suspense fallback={<span className="line-btn !min-h-10 !w-24 opacity-50" aria-hidden="true" />}><HeaderAuth /></Suspense>} />
          <main>{children}</main>
          <BottomNav />
        </UiAlertProvider>
      </body>
    </html>
  );
}
