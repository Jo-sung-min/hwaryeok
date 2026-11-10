import { notFound, redirect } from "next/navigation";
import { Building2, Check, Clock3, X } from "lucide-react";
import { AdminHeader } from "@/app/admin/admin-ui";
import { reviewExpertAction } from "@/app/admin/experts/actions";
import { getAdminExpertApplications } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";

const statusName = { PENDING: "검토 중", VERIFIED: "승인", REJECTED: "반려", SUSPENDED: "중지" };

export default async function AdminExpertsPage() {
  const user = await requireSession("/admin/experts");
  if (user.role !== "ADMIN") redirect("/");
  const { accessToken } = await readAuthTokens();
  const applications = accessToken
    ? await getAdminExpertApplications(accessToken).catch((error) => recoverAdminPageSession(error, "/admin/experts"))
    : [];

  return (
    <div>
      <AdminHeader title="전문가 인증" meta={`신청 ${applications.length}건 · 대기 ${applications.filter((item) => item.status === "PENDING").length}건`} />

      <main className="container-page">
        <div className="space-y-5">
          {applications.map((application) => (
            <article key={application.id} className="paper-card rounded-[24px] p-5 sm:rounded-[26px] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-myeongjo text-2xl font-bold">{application.realName}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${application.status === "VERIFIED" ? "bg-[#e5f1e8] text-[#4e7258]" : application.status === "REJECTED" ? "bg-[#f7e2e6] text-[#9b4b5f]" : "bg-[#fae9cf] text-[#936522]"}`}>{statusName[application.status]}</span></div>
                  <p className="mt-2 text-sm text-[#75646a]">{application.specialty ?? "의사 인증 신청"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">{application.topics.map((topic) => <span key={topic.code} className="rounded-full bg-[#f7e3e8] px-2.5 py-1 text-[10px] font-semibold text-[#955064]">#{topic.name}</span>)}</div>
                </div>
                <div className="min-w-0 rounded-2xl border border-[#e6cbd2] bg-white/70 p-4 text-xs leading-6 text-[#716167] sm:min-w-72">
                  <p className="flex min-w-0 items-center gap-2 font-bold"><Building2 size={15} className="shrink-0" /><span className="truncate">{application.workplace?.hospitalName}</span></p>
                  <p className="mt-1 break-words">{application.workplace?.region}</p><p className="break-words">{application.workplace?.address}</p>
                </div>
              </div>
              {application.status === "PENDING" ? (
                <form action={reviewExpertAction.bind(null, application.id)} className="mt-6 border-t border-[#ead9dd] pt-5">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#dec2c9] bg-white px-3 text-xs font-semibold"><input type="checkbox" name="doctorVerified" defaultChecked className="accent-[#a45064]" /> 의사 면허 확인</label>
                    <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#dec2c9] bg-white px-3 text-xs font-semibold"><input type="checkbox" name="specialistVerified" defaultChecked={application.specialistRequested} className="accent-[#a45064]" /> 전문의 자격 확인</label>
                    <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#dec2c9] bg-white px-3 text-xs font-semibold"><input type="checkbox" name="workplaceVerified" defaultChecked className="accent-[#a45064]" /> 근무지 확인</label>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2"><button type="submit" name="decision" value="approve" className="ink-btn !min-h-11"><Check size={16} /> 승인</button><button type="submit" name="decision" value="reject" className="line-btn !min-h-11 text-[#994a5e]"><X size={16} /> 반려</button></div>
                </form>
              ) : (
                <p className="mt-5 flex items-center gap-2 border-t border-[#ead9dd] pt-4 text-xs text-[#837078]"><Clock3 size={14} /> {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(application.updatedAt))} 처리</p>
              )}
            </article>
          ))}
          {!applications.length && <div className="rounded-[26px] border border-dashed border-[#d8b6bf] py-14 text-center text-sm text-[#826f75]">아직 전문가 인증 신청이 없어요.</div>}
        </div>
      </main>
    </div>
  );
}
