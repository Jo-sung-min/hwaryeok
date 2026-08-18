import Link from "next/link";
import { ArrowLeft, Clock3, ShieldCheck } from "lucide-react";
import { ApplicationForm } from "@/app/experts/apply/application-form";
import { ApiRequestError, getMyExpertApplication } from "@/lib/api";
import { readAuthTokens, requireSession } from "@/lib/auth-session";

const statusCopy = { PENDING: ["검토 중", "신청서가 접수되어 관리자가 인증 정보를 확인하고 있어요."], VERIFIED: ["인증 완료", "전문가 답변 활동을 시작할 수 있어요."], REJECTED: ["재확인 필요", "입력 내용을 확인해 다시 신청해 주세요."], SUSPENDED: ["활동 일시 중지", "관리자에게 문의해 주세요."] } as const;

export default async function ExpertApplyPage() {
  await requireSession("/experts/apply");
  const { accessToken } = await readAuthTokens();
  let application = null;
  if (accessToken) { try { application = await getMyExpertApplication(accessToken); } catch (error) { if (!(error instanceof ApiRequestError) || error.status !== 404) throw error; } }
  const copy = application ? statusCopy[application.status] : null;
  return <div className="min-h-screen pb-24"><section className="border-b border-[#ebcfd6] bg-[#fff4f6] py-10"><div className="container-page max-w-3xl"><Link href="/experts" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#79676d]"><ArrowLeft size={16} /> 전문가 홈</Link><p className="eyebrow mb-2 mt-4">EXPERT VERIFICATION</p><h1 className="font-myeongjo text-4xl font-bold">전문가 인증 신청</h1><p className="mt-3 text-sm leading-7 text-[#76666b]">의사·전문의·근무지 인증 상태를 각각 확인해 사용자에게 투명하게 표시합니다.</p></div></section><section className="container-page max-w-3xl py-9">{application && application.status !== "REJECTED" ? <div className="paper-card rounded-[28px] p-7 md:p-9"><span className={`grid h-14 w-14 place-items-center rounded-2xl ${application.status === "VERIFIED" ? "bg-[#e7f3ea] text-[#4f7459]" : "bg-[#f7e2c4] text-[#9a6a22]"}`}>{application.status === "VERIFIED" ? <ShieldCheck size={28} /> : <Clock3 size={28} />}</span><p className="eyebrow mb-2 mt-6">APPLICATION STATUS</p><h2 className="font-myeongjo text-3xl font-bold">{copy?.[0]}</h2><p className="mt-3 text-sm leading-7 text-[#75656b]">{copy?.[1]}</p><dl className="mt-7 grid gap-4 rounded-[22px] bg-white/80 p-5 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[#8c767d]">신청자</dt><dd className="mt-1 font-bold">{application.realName}</dd></div><div><dt className="text-xs text-[#8c767d]">근무지</dt><dd className="mt-1 font-bold">{application.workplace?.hospitalName}</dd></div><div className="sm:col-span-2"><dt className="text-xs text-[#8c767d]">활동 주제</dt><dd className="mt-2 flex flex-wrap gap-2">{application.topics.map((topic) => <span key={topic.code} className="rounded-full bg-[#f6dfe5] px-3 py-1 text-xs font-semibold text-[#934d60]">{topic.name}</span>)}</dd></div></dl>{application.status === "VERIFIED" && <Link href="/questions" className="ink-btn mt-6 w-full">답변할 질문 둘러보기</Link>}</div> : <div className="paper-card rounded-[28px] p-6 md:p-9">{application?.status === "REJECTED" && <div className="mb-7 rounded-[20px] bg-[#fff0f2] p-4 text-sm text-[#984458]"><strong>재확인이 필요해요.</strong><p className="mt-1 text-xs leading-6">정보를 보완해 신청서를 다시 제출할 수 있습니다.</p></div>}<ApplicationForm /></div>}</section></div>;
}
