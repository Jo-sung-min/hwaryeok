import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#f5f5f7] pb-28 text-[#1d1d1f]">{children}</div>;
}
