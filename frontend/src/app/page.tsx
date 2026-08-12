import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Droplets, FlaskConical, Leaf, Quote, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Footer } from "@/components/footer";
import { GradeSeal, ProductCard, ScoreRing } from "@/components/product-ui";
import { products } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[690px] overflow-hidden border-b border-[#8e6b5515] md:min-h-[760px]">
        <Image src="/hero-watercolor.png" alt="한지 위에 수채화로 그린 분홍 매화와 화장품" fill priority className="object-cover object-[61%_center] md:object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fbf7ed]/45 via-transparent to-transparent md:hidden" />
        <div className="container-page relative z-10 flex min-h-[610px] items-center pb-20 pt-14 md:min-h-[686px] md:pb-0 md:pt-0">
          <div className="max-w-[610px] fade-up">
            <div className="mb-7 flex items-center gap-3">
              <span className="seal h-12 w-12 font-myeongjo text-2xl font-bold">花力</span>
              <div><p className="text-[10px] font-bold tracking-[.24em] text-[#9c6d5e]">PERSONAL BEAUTY INDEX</p><p className="mt-1 text-xs text-[#766860]">내 피부로 읽는 화장품의 힘</p></div>
            </div>
            <p className="eyebrow mb-5">당신만의 화력 등급</p>
            <h1 className="font-myeongjo text-[42px] font-medium leading-[1.26] tracking-[-.065em] text-[#332b26] sm:text-[54px] md:text-[64px]">
              이 화장품,<br /><span className="relative text-[#984944]">내 피부</span>에는 몇 등급일까?
            </h1>
            <p className="mt-6 max-w-[500px] text-[15px] leading-7 text-[#695d55] md:text-base md:leading-8">같은 화장품도 피부에 따라 힘이 달라집니다.<br className="hidden sm:block" /> 화력은 성분과 피부 고민을 섬세하게 읽어, 나만의 적합도를 보여드려요.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/profile" className="ink-btn group">내 피부 화력 분석하기 <ArrowRight size={17} className="transition group-hover:translate-x-1" /></Link>
              <Link href="/products" className="line-btn"><Search size={17} /> 화장품 찾아보기</Link>
            </div>
            <div className="mt-8 flex items-center gap-4 text-xs text-[#756960]"><span className="flex items-center gap-1.5"><Check size={14} className="text-[#a54f49]" /> 2분 피부 분석</span><span className="h-3 w-px bg-[#75695f35]" /><span>8,420명이 화력을 찾았어요</span></div>
          </div>
        </div>
        <div className="absolute bottom-6 right-[8%] hidden items-center gap-3 rounded-2xl border border-white/60 bg-[#fffaf2b8] p-3 pr-5 shadow-[0_15px_35px_rgba(82,55,42,.12)] backdrop-blur-md lg:flex float-soft">
          <GradeSeal grade={1} compact />
          <div><p className="text-[10px] font-bold tracking-wider text-[#9b6b5b]">오늘의 1등급</p><p className="mt-1 font-myeongjo text-sm font-semibold">장벽을 다독이는 수분 크림</p></div>
        </div>
      </section>

      <section className="relative py-24 md:py-32">
        <div className="container-page">
          <div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="eyebrow mb-5">MY HWA:RYEOK</p>
              <h2 className="section-title font-myeongjo">평균 별점 대신,<br />내 피부의 답을 봐요.</h2>
              <p className="mt-5 max-w-md text-[15px] leading-8 text-[#756960]">수부지에 민감함과 속건조를 함께 가진 ‘윤서’님의 분석 결과예요. 같은 제품도 피부 프로필이 달라지면 등급과 설명이 함께 달라집니다.</p>
              <div className="mt-8 grid gap-4">
                {[{ icon: Droplets, title: "속건조 보습력", text: "수분을 오래 잡아두는 성분 조합이 잘 맞아요." }, { icon: ShieldCheck, title: "민감 피부 편안함", text: "자극 가능성이 낮고 장벽을 돕는 성분이 충분해요." }, { icon: FlaskConical, title: "성분 근거", text: "막연한 추천이 아니라 전성분과 피부 고민을 함께 봐요." }].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-4"><span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#dca39426] text-[#9c514a]"><Icon size={18} /></span><div><strong className="font-myeongjo text-[16px]">{title}</strong><p className="mt-1 text-sm leading-6 text-[#7a6e65]">{text}</p></div></div>
                ))}
              </div>
            </div>
            <div className="watercolor-edge paper-card relative overflow-hidden rounded-[34px] p-6 md:p-9">
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#e6a59118] blur-3xl" />
              <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
                <div>
                  <span className="rounded-full bg-[#87927c1c] px-3 py-1.5 text-xs font-semibold text-[#667060]">수부지 · 민감 · 속건조</span>
                  <p className="mt-5 text-sm text-[#7d6e64]">자작나무 수분 크림의</p>
                  <h3 className="mt-1 font-myeongjo text-3xl font-semibold">나의 화력</h3>
                  <div className="mt-5 flex items-center gap-4"><GradeSeal grade={1} /><div><strong className="font-myeongjo text-2xl">아주 잘 맞아요</strong><p className="mt-1 text-xs text-[#8a786d]">상위 7%의 높은 궁합</p></div></div>
                </div>
                <ScoreRing score={94} />
              </div>
              <div className="relative mt-8 rounded-2xl border border-[#a67b6517] bg-[#f6eee1b5] p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#9b4c46]"><Sparkles size={15} /> 왜 1등급인가요?</div>
                <p className="text-sm leading-7 text-[#675b53]">보습과 장벽 강화 성분은 충분하고, 민감한 피부가 걱정할 만한 성분은 적어요. 다만 여름에는 양을 조금 덜어 써보세요.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#75564512] bg-[#f3eadb78] py-20 md:py-24">
        <div className="container-page text-center">
          <p className="eyebrow mb-4">POWER SCALE</p>
          <h2 className="section-title font-myeongjo">다섯 송이로 읽는 화장품의 힘</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#786c63]">점수가 높을수록 낮은 등급을 받아요. 1등급은 지금 내 피부에 가장 아름답게 피어나는 궁합입니다.</p>
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-5 gap-2 md:gap-6">
            {[1,2,3,4,5].map((grade) => (
              <div key={grade} className="group text-center">
                <div className={`mx-auto grid rounded-full text-[#d87f6d] transition group-hover:-translate-y-1 ${grade === 1 ? "h-14 w-14 text-2xl opacity-45" : grade === 2 ? "h-16 w-16 text-3xl opacity-55" : grade === 3 ? "h-[72px] w-[72px] text-4xl opacity-70" : grade === 4 ? "h-20 w-20 text-[42px] opacity-80" : "h-[88px] w-[88px] text-5xl"} place-items-center bg-[#e8a18f18]`}>{grade === 1 ? "❀" : grade === 2 ? "✾" : "✿"}</div>
                <p className="mt-3 font-myeongjo text-lg font-semibold">{grade}등급</p>
                <p className="mt-1 hidden text-[11px] text-[#8a7b70] sm:block">{grade === 1 ? "90–100" : grade === 2 ? "80–89" : grade === 3 ? "65–79" : grade === 4 ? "50–64" : "0–49"}점</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="container-page">
          <div className="mb-10 flex items-end justify-between gap-5">
            <div><p className="eyebrow mb-4">FOR YOUR SKIN</p><h2 className="section-title font-myeongjo">민감한 수부지 피부에<br className="sm:hidden" /> 잘 피어나는 제품</h2></div>
            <Link href="/products" className="hidden items-center gap-1 text-sm font-semibold text-[#9b4a45] sm:flex">모두 보기 <ChevronRight size={17} /></Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.slice(0,3).map((product) => <ProductCard key={product.id} product={product} />)}</div>
          <Link href="/products" className="line-btn mt-7 w-full sm:hidden">추천 제품 모두 보기</Link>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="container-page overflow-hidden rounded-[34px] bg-[#33302a] text-[#fffaf2]">
          <div className="grid lg:grid-cols-[1fr_1.08fr]">
            <div className="p-8 md:p-14">
              <p className="text-xs font-bold tracking-[.18em] text-[#e3aa99]">화력 랭킹</p>
              <h2 className="mt-4 font-myeongjo text-3xl leading-snug md:text-4xl">나와 같은 피부가<br />선택한 진짜 1등</h2>
              <p className="mt-5 text-sm leading-7 text-[#d7cec3]">판매량이 아닌 피부 유형별 적합도로 순위를 매겼어요. 수부지·민감 피부에게 가장 잘 맞는 수분 크림을 확인해보세요.</p>
              <Link href="/ranking" className="mt-8 inline-flex items-center gap-2 border-b border-[#e3aa9980] pb-1 text-sm text-[#f1c2b3]">내 피부 랭킹 보기 <ArrowRight size={16} /></Link>
            </div>
            <div className="bg-[#f5ecdf] p-5 text-[#302a25] md:p-8">
              {products.slice(0,3).map((product, index) => (
                <Link href={`/products/${product.id}`} key={product.id} className="flex items-center gap-4 border-b border-[#74513f18] py-4 last:border-0">
                  <span className={`font-myeongjo text-2xl ${index === 0 ? "text-[#a54f49]" : "text-[#9b8c81]"}`}>{String(index + 1).padStart(2,"0")}</span>
                  <div className="min-w-0 flex-1"><p className="text-[10px] font-bold tracking-wider text-[#8b776a]">{product.brand}</p><p className="mt-1 truncate font-myeongjo font-semibold">{product.name}</p></div>
                  <div className="text-right"><strong className="font-myeongjo text-xl text-[#9b4a45]">{product.score}</strong><p className="text-[9px] text-[#8c7e73]">나의 적합도</p></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#75564512] bg-[#fffaf3a8] py-20">
        <div className="container-page text-center">
          <Quote className="mx-auto text-[#d49380]" size={34} strokeWidth={1.4} />
          <blockquote className="mx-auto mt-6 max-w-3xl font-myeongjo text-2xl leading-relaxed md:text-3xl">“별점 4.8보다, 나와 비슷한 피부가 왜 잘 맞았는지 알게 된 게 더 좋았어요.”</blockquote>
          <p className="mt-5 text-xs text-[#817269]">수부지 · 민감 피부 사용자 은채님의 화력 기록</p>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="container-page relative overflow-hidden rounded-[34px] border border-[#9e725c1f] bg-[#f1e6d6] px-6 py-16 text-center md:py-20">
          <div className="absolute left-[8%] top-8 text-5xl text-[#d58b7860]">❀</div><div className="absolute bottom-8 right-[10%] text-4xl text-[#d58b7845]">✿</div>
          <p className="eyebrow mb-4">BEGIN YOUR RITUAL</p>
          <h2 className="font-myeongjo text-3xl font-medium leading-snug md:text-5xl">오늘, 내 피부의 화력을<br />처음 피워보세요.</h2>
          <p className="mt-5 text-sm leading-7 text-[#74675e]">2분이면 충분해요. 피부 타입과 고민을 알려주면<br className="hidden sm:block" /> 모든 화장품을 나만의 등급으로 다시 보여드릴게요.</p>
          <Link href="/profile" className="ink-btn mt-8">무료로 피부 분석 시작 <ArrowRight size={17} /></Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
