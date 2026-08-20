import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export function LegalPage({ eyebrow, title, description, effectiveDate, sections }: {
  eyebrow: string;
  title: string;
  description: string;
  effectiveDate: string;
  sections: LegalSection[];
}) {
  return (
    <div className="container-page py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#86576a] transition hover:text-[#5e3445]">
          <ArrowLeft size={16} /> 홈으로 돌아가기
        </Link>

        <header className="mt-7 rounded-[30px] border border-white/75 bg-white/65 px-6 py-9 shadow-[0_18px_50px_rgba(83,38,55,.09)] backdrop-blur-xl sm:px-9 md:py-12">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 font-myeongjo text-3xl font-semibold md:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#746970]">{description}</p>
          <p className="mt-5 text-xs font-medium text-[#9b7180]">시행일 {effectiveDate}</p>
        </header>

        <div className="mt-7 grid gap-4">
          {sections.map((section, index) => (
            <section key={section.title} className="rounded-[24px] border border-[#9f597018] bg-white/64 p-6 sm:p-8">
              <h2 className="font-myeongjo text-xl font-semibold text-[#3f3036]">
                <span className="mr-2 text-sm font-bold text-[#ad536d]">{String(index + 1).padStart(2, "0")}</span>
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-4 text-sm leading-7 text-[#746970]">{paragraph}</p>)}
              {section.items && (
                <ul className="mt-4 grid gap-2.5 text-sm leading-7 text-[#746970]">
                  {section.items.map((item) => <li key={item} className="flex gap-3"><span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c26f88]" />{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-xs leading-6 text-[#8b7a81]">문의: <a href="mailto:wings2530@gmail.com" className="font-semibold text-[#8c5368] hover:underline">wings2530@gmail.com</a> · 070-8027-2561</p>
      </div>
    </div>
  );
}
