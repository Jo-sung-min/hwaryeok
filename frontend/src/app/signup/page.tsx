import Link from "next/link";
import { ArrowLeft, Check, Flower2, LockKeyhole } from "lucide-react";
import { SignupForm } from "./signup-form";
import { getOAuthProviders } from "@/lib/api";

export default async function SignupPage() {
  const oauthProviders = await getOAuthProviders();
  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#fff1f4] py-6 md:min-h-[calc(100vh-74px)] md:py-14">
      <div className="container-page">
        <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm text-[#76685f]"><ArrowLeft size={16} /> 홈으로</Link>
        <div className="grid gap-7 lg:grid-cols-[.86fr_1.14fr] lg:items-stretch">
          <aside className="relative hidden overflow-hidden rounded-[32px] border border-[#e3b1bd38] bg-[#f9e2e8] p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/50 blur-3xl" />
            <div className="relative">
              <span className="seal grid h-14 w-14 place-items-center font-myeongjo text-xl">花力</span>
              <p className="eyebrow mb-4 mt-9">YOUR BEAUTY, YOUR POWER</p>
              <h2 className="font-myeongjo text-4xl font-medium leading-snug">같은 화장품도<br />내 피부에는 다르게 피어나요.</h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-[#72655d]">계정 하나로 피부 프로필, 나의 화력 분석, 찜과 비교 기록을 차곡차곡 이어갈 수 있어요.</p>
            </div>
            <ul className="relative mt-12 grid gap-4 text-sm text-[#675d56]">
              {["내 피부 기준 화력 등급", "성분별 좋은 점과 주의점", "찜·비교·최근 본 기록"].map((item) => <li key={item} className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#87927c20] text-[#697461]"><Check size={14} /></span>{item}</li>)}
            </ul>
            <div className="relative mt-10 flex items-center gap-3 rounded-2xl border border-white/50 bg-[#fffaf28f] p-4 text-xs leading-6 text-[#70665e]"><LockKeyhole size={18} className="shrink-0 text-[#8f5148]" />비밀번호는 복원할 수 없는 방식으로 암호화해 보관해요.</div>
            <Flower2 className="absolute bottom-8 right-8 text-[#c77c6870]" size={70} strokeWidth={0.8} />
          </aside>
          <div className="mx-auto w-full max-w-xl"><SignupForm oauthProviders={oauthProviders} /></div>
        </div>
      </div>
    </div>
  );
}
