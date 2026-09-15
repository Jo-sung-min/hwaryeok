"use client";

import { Check, ChevronDown, Globe2, LoaderCircle, Save, SearchCheck, Share2 } from "lucide-react";
import { useActionState, useState, type ReactNode } from "react";
import type { SeoChangeFrequency, SeoPageSetting } from "@/lib/types";
import { updateSeoPageAction, type SeoActionState } from "./actions";

const initialState: SeoActionState = { success: false, message: "" };
const MAX_KEYWORDS_INPUT_LENGTH = 1240;
const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-[#dec4cb] bg-white px-3 text-sm outline-none transition focus:border-[#b55b73] focus:ring-2 focus:ring-[#edcbd5]";
const frequencyOptions: Array<{ value: SeoChangeFrequency; label: string }> = [
  { value: "ALWAYS", label: "항상" },
  { value: "HOURLY", label: "매시간" },
  { value: "DAILY", label: "매일" },
  { value: "WEEKLY", label: "매주" },
  { value: "MONTHLY", label: "매월" },
  { value: "YEARLY", label: "매년" },
  { value: "NEVER", label: "변경 없음" },
];

export function SeoPageForm({ page }: { page: SeoPageSetting }) {
  const [state, formAction, pending] = useActionState(updateSeoPageAction.bind(null, page.pageKey), initialState);
  const [expanded, setExpanded] = useState(page.pageKey === "HOME");
  const [indexable, setIndexable] = useState(page.indexable);
  const [includeInSitemap, setIncludeInSitemap] = useState(page.indexable && page.includeInSitemap);
  const fieldError = (name: string) => state.fieldErrors?.[name];
  const inputAccessibility = (name: string, hasHint = false) => {
    const id = `seo-${page.pageKey.toLowerCase()}-${name}`;
    const error = fieldError(name);
    return {
      id,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
    };
  };
  const titleField = inputAccessibility("title", true);
  const descriptionField = inputAccessibility("description", true);
  const keywordsField = inputAccessibility("keywords", true);
  const ogTitleField = inputAccessibility("ogTitle", true);
  const ogDescriptionField = inputAccessibility("ogDescription", true);
  const ogImageField = inputAccessibility("ogImageUrl", true);
  const changeFrequencyField = inputAccessibility("changeFrequency");
  const priorityField = inputAccessibility("priority", true);

  return (
    <details
      className="group overflow-hidden rounded-[26px] border border-[#e4cbd3] bg-white shadow-[0_10px_30px_rgba(127,69,85,.05)]"
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary className="flex min-h-20 cursor-pointer list-none items-center gap-4 px-5 py-4 marker:hidden sm:px-7">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff0f4] text-[#a74e68]"><Globe2 size={20} /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-myeongjo text-lg font-bold sm:text-xl">{page.displayName}</span>
          <span className="mt-1 block truncate text-[11px] text-[#927b84]">{page.path} · {page.indexable ? "검색 노출" : "검색 미노출"} · {page.includeInSitemap && page.indexable ? "사이트맵 포함" : "사이트맵 제외"}</span>
        </span>
        <ChevronDown size={18} className="shrink-0 text-[#a07987] transition group-open:rotate-180" aria-hidden="true" />
      </summary>

      <form action={formAction} className="grid gap-7 border-t border-[#f0dfe4] bg-[#fffafb] p-5 sm:p-7">
        <section aria-labelledby={`${page.pageKey}-search-title`}>
          <div className="mb-4 flex items-center gap-2 text-[#9e4762]"><SearchCheck size={18} /><h3 id={`${page.pageKey}-search-title`} className="text-sm font-bold">검색 결과 정보</h3></div>
          <div className="grid gap-5">
            <Field id={titleField.id} label="브라우저·검색 제목" error={fieldError("title")} hint="최대 100자 · 입력한 문구가 접미사 없이 그대로 제목에 반영돼요.">
              <input {...titleField} name="title" required maxLength={100} defaultValue={page.title} className={inputClass} />
            </Field>
            <Field id={descriptionField.id} label="검색 설명" error={fieldError("description")} hint="최대 300자 · 페이지 내용을 정확하게 설명하는 1~2문장을 권장해요.">
              <textarea {...descriptionField} name="description" required maxLength={300} rows={3} defaultValue={page.description} className={`${inputClass} py-3 leading-6`} />
            </Field>
            <Field id={keywordsField.id} label="검색 키워드" error={fieldError("keywords")} hint="최대 20개, 각 60자 · 쉼표 또는 줄바꿈으로 구분해 주세요.">
              <textarea {...keywordsField} name="keywords" maxLength={MAX_KEYWORDS_INPUT_LENGTH} rows={2} defaultValue={page.keywords.join(", ")} className={`${inputClass} py-3 leading-6`} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle
                name="indexable"
                checked={indexable}
                onCheckedChange={(checked) => {
                  setIndexable(checked);
                  if (!checked) setIncludeInSitemap(false);
                }}
                label="검색엔진 노출 허용"
                description="끄면 noindex로 표시하고 사이트맵에서도 제외해요."
              />
              <Toggle name="followLinks" defaultChecked={page.followLinks} label="페이지 링크 수집 허용" description="검색봇이 이 페이지의 링크를 따라갈 수 있어요." />
            </div>
          </div>
        </section>

        <section aria-labelledby={`${page.pageKey}-share-title`} className="border-t border-[#eddee3] pt-7">
          <div className="mb-4 flex items-center gap-2 text-[#9e4762]"><Share2 size={18} /><h3 id={`${page.pageKey}-share-title`} className="text-sm font-bold">SNS 공유 정보</h3></div>
          <div className="grid gap-5">
            <Field id={ogTitleField.id} label="공유 제목" error={fieldError("ogTitle")} hint="최대 100자">
              <input {...ogTitleField} name="ogTitle" required maxLength={100} defaultValue={page.ogTitle} className={inputClass} />
            </Field>
            <Field id={ogDescriptionField.id} label="공유 설명" error={fieldError("ogDescription")} hint="최대 300자">
              <textarea {...ogDescriptionField} name="ogDescription" required maxLength={300} rows={3} defaultValue={page.ogDescription} className={`${inputClass} py-3 leading-6`} />
            </Field>
            <Field id={ogImageField.id} label="공유 이미지 URL" error={fieldError("ogImageUrl")} hint="최대 500자 · 1200×630 이미지를 권장해요. 비워두면 화력 기본 공유 이미지를 사용합니다.">
              <input {...ogImageField} name="ogImageUrl" maxLength={500} defaultValue={page.ogImageUrl ?? ""} placeholder="https://... 또는 /이미지.png" className={inputClass} />
            </Field>
          </div>
        </section>

        <section aria-labelledby={`${page.pageKey}-sitemap-title`} className="border-t border-[#eddee3] pt-7">
          <div className="mb-4 flex items-center gap-2 text-[#9e4762]"><Globe2 size={18} /><h3 id={`${page.pageKey}-sitemap-title`} className="text-sm font-bold">사이트맵</h3></div>
          <div className="grid gap-4 md:grid-cols-[1fr_.7fr_.5fr] md:items-start">
            <Toggle name="includeInSitemap" checked={includeInSitemap} onCheckedChange={setIncludeInSitemap} disabled={!indexable} label="사이트맵에 포함" description={indexable ? "검색봇에 이 페이지 주소와 변경 정보를 안내해요." : "검색 노출을 켜야 사이트맵에 포함할 수 있어요."} />
            <Field id={changeFrequencyField.id} label="변경 주기" error={fieldError("changeFrequency")}>
              <select {...changeFrequencyField} name="changeFrequency" required defaultValue={page.changeFrequency} className={inputClass}>
                {frequencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
            <Field id={priorityField.id} label="우선순위" error={fieldError("priority")} hint="0~1 · 소수 둘째 자리까지">
              <input {...priorityField} name="priority" type="number" required min={0} max={1} step={0.01} defaultValue={page.priority} className={inputClass} />
            </Field>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-[#ead9de] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              role={state.message ? (state.success ? "status" : "alert") : undefined}
              aria-live={state.message ? (state.success ? "polite" : "assertive") : undefined}
              className={`min-h-5 text-xs ${state.success ? "text-[#55735e]" : "text-[#a14f61]"}`}
            >{state.message && <span className="inline-flex items-center gap-1.5">{state.success && <Check size={14} />}{state.message}</span>}</p>
            <p className="mt-1 text-[10px] text-[#9b8790]">{page.updatedAt ? `마지막 저장 ${formatDateTime(page.updatedAt)}` : "기본 SEO 설정"}</p>
          </div>
          <button type="submit" disabled={pending} className="ink-btn w-full sm:w-auto">{pending ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{pending ? "반영 중" : "SEO 설정 저장"}</button>
        </div>
      </form>
    </details>
  );
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return <div className="text-xs font-bold text-[#6e5d63]"><label htmlFor={id}>{label}</label>{children}{error ? <span id={`${id}-error`} className="mt-1.5 block font-medium text-[#a14f61]">{error}</span> : hint ? <span id={`${id}-hint`} className="mt-1.5 block font-normal leading-5 text-[#917e85]">{hint}</span> : null}</div>;
}

function Toggle({
  name,
  defaultChecked,
  checked,
  onCheckedChange,
  disabled = false,
  label,
  description,
}: {
  name: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  description: string;
}) {
  return (
    <label className={`flex min-h-20 items-start gap-3 rounded-2xl border border-[#e6cfd6] bg-white p-4 text-sm font-semibold text-[#704f59] ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        name={name}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#bf4e6d]"
        {...(checked === undefined
          ? { defaultChecked }
          : { checked, onChange: (event) => onCheckedChange?.(event.target.checked) })}
      />
      <span><span className="block">{label}</span><span className="mt-1 block text-[10px] font-normal leading-5 text-[#92747d]">{description}</span></span>
    </label>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(value));
}
