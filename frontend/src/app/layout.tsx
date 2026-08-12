import type { Metadata } from "next";
import "./globals.css";
import { BottomNav, Header } from "@/components/navigation";

export const metadata: Metadata = {
  title: "화력 — 화장품의 힘을 읽다",
  description: "내 피부에 맞는 화장품을 화력 등급과 적합도 점수로 알아보세요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main>{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
