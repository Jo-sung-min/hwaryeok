import Link from "next/link";
import { BadgeCheck, Building2, HeartHandshake, MessageCircle, Stethoscope } from "lucide-react";
import type { Expert, ExpertQuestionListItem } from "@/lib/types";

export const expertTopics = [
  { code: "BARRIER", name: "피부 장벽" },
  { code: "ACNE", name: "트러블·여드름" },
  { code: "SENSITIVE", name: "민감 피부" },
  { code: "AGING", name: "탄력·노화" },
  { code: "INGREDIENT", name: "화장품 성분" },
] as const;

export function ExpertAvatar({ expert, large = false }: { expert: Expert; large?: boolean }) {
  return (
    <div className={`${large ? "h-24 w-24 text-3xl" : "h-14 w-14 text-xl"} relative grid shrink-0 place-items-center overflow-hidden rounded-[34%] border border-white bg-gradient-to-br from-[#fde8ec] via-white to-[#f5cbd5] font-myeongjo font-bold text-[#9d5264] shadow-[0_10px_24px_rgba(159,79,98,.12)]`}>
      {expert.profileImageUrl ? <img src={expert.profileImageUrl} alt="" className="h-full w-full object-cover" /> : expert.realName.slice(0, 1)}
      <span className="absolute bottom-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#a75368] text-white"><BadgeCheck size={13} /></span>
    </div>
  );
}

export function ExpertCard({ expert }: { expert: Expert }) {
  return (
    <Link href={`/experts/${expert.slug}`} className="paper-card group rounded-[26px] p-5 transition hover:-translate-y-1 hover:border-[#ce8da0]">
      <div className="flex items-start gap-4">
        <ExpertAvatar expert={expert} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h3 className="font-myeongjo text-xl font-bold">{expert.realName}</h3><span className="rounded-full bg-[#f7dce3] px-2 py-1 text-[10px] font-bold text-[#9b4b60]">인증</span></div>
          <p className="mt-1 text-xs font-semibold text-[#8b6670]">{expert.specialty ?? "의사"}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-[#8a7a7f]"><Building2 size={12} /> {expert.workplace?.hospitalName ?? "근무지 확인 중"}</p>
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#6f6166]">{expert.bio}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">{expert.topics.map((topic) => <span key={topic.code} className="rounded-full border border-[#e5b6c1] bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-[#98566a]">#{topic.name}</span>)}</div>
      <div className="mt-5 grid grid-cols-3 border-t border-[#ead6db] pt-4 text-center text-[11px] text-[#7c6d72]">
        <span><strong className="block text-base text-[#3d3336]">{expert.stats.answerCount}</strong>답변</span>
        <span><strong className="block text-base text-[#3d3336]">{expert.stats.helpfulCount}</strong>도움돼요</span>
        <span><strong className="block text-base text-[#3d3336]">{expert.stats.adoptedCount}</strong>채택</span>
      </div>
    </Link>
  );
}

export function QuestionCard({ question }: { question: ExpertQuestionListItem }) {
  return (
    <Link href={`/questions/${question.id}`} className="block rounded-[22px] border border-[#e5c4cc] bg-white/80 p-5 transition hover:border-[#c98396] hover:shadow-[0_12px_30px_rgba(160,78,98,.08)]">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
        <span className={`rounded-full px-2.5 py-1 ${question.status === "OPEN" ? "bg-[#fff0d8] text-[#97661b]" : "bg-[#e9f3ec] text-[#4f795c]"}`}>{question.status === "OPEN" ? "답변 대기" : "답변 완료"}</span>
        {question.skinType && <span className="text-[#927880]">{question.skinType}</span>}
        {question.ingredientName && <span className="text-[#a4586c]">#{question.ingredientName}</span>}
      </div>
      <h3 className="mt-3 font-myeongjo text-lg font-bold leading-7">{question.title}</h3>
      <div className="mt-4 flex items-center justify-between text-xs text-[#8a777d]"><span>{question.authorNickname}</span><span className="flex items-center gap-1"><MessageCircle size={14} /> 답변 {question.answerCount}</span></div>
    </Link>
  );
}

export function ExpertDisclaimer() {
  return <div className="flex gap-3 rounded-[20px] border border-[#e6c4cc] bg-[#fff9fa] p-4 text-xs leading-6 text-[#74666a]"><HeartHandshake className="mt-0.5 shrink-0 text-[#a65368]" size={20} /><p>전문가 활동 표시는 화력 안의 답변과 기여도를 설명합니다. 의료진의 의학적 실력이나 치료 결과를 평가하는 지표가 아니며, 온라인 답변은 진료를 대신하지 않습니다.</p></div>;
}

export function VerificationBadges({ expert }: { expert: Expert }) {
  return <div className="flex flex-wrap gap-2 text-xs font-semibold">{expert.doctorVerified && <span className="inline-flex items-center gap-1 rounded-full bg-[#f6dbe2] px-3 py-1.5 text-[#94465a]"><Stethoscope size={13} /> 의사 인증</span>}{expert.specialistVerified && <span className="rounded-full bg-[#f6dbe2] px-3 py-1.5 text-[#94465a]">전문의 인증</span>}{expert.workplaceVerified && <span className="inline-flex items-center gap-1 rounded-full bg-[#edf4ef] px-3 py-1.5 text-[#53715d]"><Building2 size={13} /> 근무지 인증</span>}</div>;
}
