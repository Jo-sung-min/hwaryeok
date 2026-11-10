import Link from "next/link";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export const adminCardClass = "rounded-[20px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)] ring-1 ring-black/[.04]";

export function AdminHeader({ title, meta, back = true, children }: {
  title: string;
  meta?: ReactNode;
  back?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className="container-page pb-6 pt-6 md:pb-8 md:pt-10">
      {back && (
        <Link href="/admin" className="-ml-1 inline-flex min-h-9 items-center gap-0.5 text-[13px] font-medium text-[#86868b] transition hover:text-[#1d1d1f]">
          <ChevronLeft size={16} />관리자
        </Link>
      )}
      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] md:text-[34px]">{title}</h1>
          {meta && <p className="mt-1 text-[13px] text-[#86868b]">{meta}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}

export function AdminCard({ href, icon: Icon, title, value, unit, detail, attention = false }: {
  href: string;
  icon: LucideIcon;
  title: string;
  value?: number;
  unit?: string;
  detail?: string;
  attention?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${adminCardClass} group flex min-h-[148px] flex-col justify-between p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] md:p-6`}
    >
      <span className="flex items-start justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5f5f7]"><Icon size={18} strokeWidth={1.8} /></span>
        <ChevronRight size={18} className="text-[#c7c7cc] transition group-hover:translate-x-0.5 group-hover:text-[#86868b]" />
      </span>
      <span className="block">
        <span className="flex items-center gap-1.5 text-[15px] font-semibold">
          {title}
          {attention && <><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#ff9f0a]" /><span className="sr-only">확인 필요</span></>}
        </span>
        {value !== undefined && (
          <span className="mt-1 block text-[30px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
            {value.toLocaleString("ko-KR")}
            {unit && <span className="ml-0.5 text-[15px] font-medium text-[#86868b]">{unit}</span>}
          </span>
        )}
        {detail && <span className="mt-1.5 block text-[12px] text-[#86868b]">{detail}</span>}
      </span>
    </Link>
  );
}
