import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  GitCompareArrows,
  HeartHandshake,
  Info,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { ProductCard } from "@/components/product-ui";
import { getRanking } from "@/lib/api";
import { getFavoriteViewState } from "@/lib/auth-session";

const reportPillars = [
  {
    icon: FlaskConical,
    title: "성분 화력",
    description: "전성분의 역할과 조합을 살펴보고, 기대할 수 있는 기능과 주의점을 편안하게 풀어드려요.",
    href: "/ingredients",
    linkLabel: "성분 이야기 보기",
  },
  {
    icon: MessageCircle,
    title: "실사용 리뷰",
    description: "카테고리별 항목에 피부 타입과 사용 기간을 더해 실제 경험을 입체적으로 읽어요.",
    href: "/products",
    linkLabel: "제품 리뷰 보기",
  },
  {
    icon: UserRoundCheck,
    title: "나의 적합도",
    description: "피부 타입과 고민을 더해 지금의 나와 잘 맞는 이유를 섬세하게 보여드려요.",
    href: "/skin-check",
    linkLabel: "1분 피부 체크",
  },
  {
    icon: ShieldCheck,
    title: "정보 신뢰도",
    description: "리뷰 수와 근거 수준, 최근 확인 정보를 함께 보여 현재 리포트의 깊이를 알려드려요.",
    href: "/principles",
    linkLabel: "화력 읽는 법",
  },
];

export default async function HomePage() {
  const [favoriteState, featuredProducts] = await Promise.all([
    getFavoriteViewState(),
    getRanking("수부지", 3),
  ]);
  const favoriteIds = new Set(favoriteState.favoriteIds);

  return (
    <>
      <section className="relative min-h-[720px] overflow-hidden border-b border-[#8e6b5515] md:min-h-[790px]">
        <Image src="/hero-watercolor.png" alt="한지 위에 수채화로 그린 분홍 매화와 화장품" fill priority className="object-cover object-[61%_center] md:object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/78 via-[#fff7f8]/38 to-transparent md:from-white/62" />
        <div className="container-page relative z-10 flex min-h-[650px] items-center pb-16 pt-12 md:min-h-[710px] md:pb-0 md:pt-0">
          <div className="min-w-0 w-full max-w-[650px] fade-up">
            <div className="mb-6 flex items-center gap-3">
              <span className="seal seal-wordmark h-12 w-12 font-myeongjo text-xl font-bold" aria-label="화력">花力</span>
              <div><p className="text-[10px] font-bold tracking-[.24em] text-[#9c6d5e]">MY SKIN, MY BEAUTY STORY</p><p className="mt-1 text-xs text-[#766860]">성분부터 사용감까지, 나답게 발견해요</p></div>
            </div>

            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#b86d8030] bg-white/70 px-3 py-1.5 text-[11px] font-bold text-[#934b60] backdrop-blur"><Sparkles size={14} /> 내 피부 맞춤 뷰티 가이드</p>
            <h1 className="font-myeongjo text-[42px] font-medium leading-[1.22] tracking-[-.065em] text-[#332b26] max-[359px]:text-[36px] sm:text-[54px] md:text-[64px]">
              내 피부에 맞는<br /><span className="relative text-[#98495d]">화장품 이야기</span>
            </h1>
            <p className="mt-6 max-w-[560px] text-[15px] leading-7 text-[#695d55] md:text-base md:leading-8">브랜드 인지도보다 성분과 내 피부 신호를 먼저 보고, 고르기 쉬운 이유와 주의점을 함께 보여드려요.</p>

            <form action="/products" role="search" aria-label="내 피부 맞춤 화장품 검색" className="glass-field mt-8 flex min-h-[62px] max-w-[590px] items-center gap-2 rounded-[22px] p-2 pl-4">
              <Search size={20} className="shrink-0 text-[#9f5364]" aria-hidden="true" />
              <label htmlFor="home-product-query" className="sr-only">제품명 또는 브랜드 검색</label>
              <input id="home-product-query" name="query" type="search" enterKeyHint="search" placeholder="제품명이나 브랜드를 검색해 보세요" className="min-w-0 flex-1 bg-transparent px-1 text-base text-[#463a36] outline-none placeholder:text-[#9d8a89]" />
              <button type="submit" className="ink-btn !min-h-11 shrink-0 !px-4 sm:!px-5"><span className="hidden sm:inline">화장품 찾기</span><Search size={17} /><span className="sr-only sm:hidden">검색</span></button>
            </form>

            <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap">
              <Link href="/skin-check" className="ink-btn w-full sm:w-auto"><Sparkles size={17} /> 1분 피부 체크</Link>
              <Link href="/profile" className="line-btn w-full sm:w-auto">내 피부 기준 저장</Link>
              <Link href="/principles" className="line-btn w-full sm:w-auto"><Info size={17} /> 화력 리포트 읽는 법</Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#756960]">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#a54f63]" /> 성분과 사용감을 한눈에</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#a54f63]" /> 내 피부 프로필로 더 섬세하게</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#a54f63]" /> 광고비·판매량을 점수에서 제외</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 right-[7%] hidden items-center gap-3 rounded-2xl border border-white/70 bg-white/78 p-4 pr-5 shadow-[0_15px_35px_rgba(146,77,94,.13)] backdrop-blur-md lg:flex float-soft">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#a6536814] text-[#a65368]"><HeartHandshake size={20} /></span>
          <div><p className="text-[10px] font-bold tracking-wider text-[#9b6b6b]">오늘의 뷰티 가이드</p><p className="mt-1 text-sm font-semibold">내 피부에 맞는 화장품을 천천히 발견해요</p></div>
        </div>
      </section>

      <section className="border-b border-[#dfa6b51f] bg-white py-10 md:hidden">
        <div className="container-page">
          <p className="text-[11px] font-bold tracking-[.16em] text-[#b45f75]">QUICK START</p>
          <h2 className="mt-2 font-myeongjo text-[27px] font-semibold leading-tight">지금 필요한 정보부터<br />바로 확인하세요.</h2>
          <div className="mt-6 grid gap-3">
            <Link href="/skin-check" className="glass-choice flex min-h-[76px] items-center gap-3 rounded-[20px] p-4"><span className="choice-icon grid h-11 w-11 shrink-0 place-items-center rounded-full"><Sparkles size={19} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">1분 피부 체크</strong><small className="choice-copy mt-1 block text-[10px]">로그인 없이 맞는 성분과 제품 확인</small></span><ArrowRight size={17} /></Link>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/ingredients" className="glass-choice flex min-h-[72px] items-center gap-2 rounded-[20px] p-3"><span className="choice-icon grid h-10 w-10 shrink-0 place-items-center rounded-full"><BookOpen size={18} /></span><span><strong className="block text-xs">성분 사전</strong><small className="choice-copy mt-1 block text-[9px]">근거와 주의점</small></span></Link>
              <Link href="/compare" className="glass-choice flex min-h-[72px] items-center gap-2 rounded-[20px] p-3"><span className="choice-icon grid h-10 w-10 shrink-0 place-items-center rounded-full"><GitCompareArrows size={18} /></span><span><strong className="block text-xs">제품 비교</strong><small className="choice-copy mt-1 block text-[9px]">같은 조건으로</small></span></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-28">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[.88fr_1.12fr] lg:gap-20">
          <div>
            <p className="eyebrow mb-5">ONE CLEAR REPORT</p>
            <h2 className="section-title font-myeongjo">네 가지 이야기가 모여<br />하나의 화력이 돼요.</h2>
            <p className="mt-5 max-w-md text-[15px] leading-8 text-[#756960]">성분과 사용감, 피부 궁합, 정보 상태를 차례로 읽으면 제품이 나와 잘 맞는 이유가 더 선명해져요.</p>
            <div className="mt-8 grid gap-4">
              {[
                "성분 구성과 실제 사용 경험을 함께 발견",
                "내 피부 프로필을 더해 섬세하게 해석",
                "리뷰 수와 정보의 깊이까지 한눈에 확인",
              ].map((text) => <div key={text} className="flex items-center gap-3 text-sm text-[#645952]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#a6536812] text-[#a65368]"><CheckCircle2 size={16} /></span>{text}</div>)}
            </div>
          </div>

          <div className="watercolor-edge paper-card relative overflow-hidden rounded-[30px] p-6 md:p-9">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#e6a59118] blur-3xl" />
            <div className="relative flex items-start justify-between gap-5">
              <div><p className="text-[10px] font-bold tracking-[.16em] text-[#a65368]">화력 리포트 미리보기</p><h3 className="mt-2 font-myeongjo text-2xl font-semibold">나에게 맞는 이유를 한눈에</h3></div>
              <span className="seal h-11 w-11 font-myeongjo text-base">解</span>
            </div>
            <div className="relative mt-7 grid gap-3">
              {[
                { icon: FlaskConical, label: "성분 화력", value: "보습·장벽 구성을 확인했어요", tone: "bg-[#edf1e8] text-[#687562]" },
                { icon: MessageCircle, label: "실사용", value: "리뷰 수와 항목별 평균을 함께 표시", tone: "bg-[#fff0f3] text-[#9a4e62]" },
                { icon: UserRoundCheck, label: "나의 적합도", value: "내 프로필 적용 여부를 구분", tone: "bg-[#f2ece5] text-[#806b5d]" },
                { icon: ShieldCheck, label: "정보 상태", value: "리뷰 수와 근거 수준까지 함께 표시", tone: "bg-[#edf1e8] text-[#687562]" },
              ].map(({ icon: Icon, label, value, tone }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/75 bg-white/68 p-4">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}><Icon size={17} /></span>
                  <div className="min-w-0"><p className="text-[10px] font-bold tracking-wider text-[#8a7770]">{label}</p><p className="mt-1 text-sm font-semibold text-[#51453f]">{value}</p></div>
                </div>
              ))}
            </div>
            <Link href="/products" className="line-btn relative mt-6 w-full">화력 리포트 둘러보기 <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dfa6b51f] bg-[#fff2f5] py-14 md:py-24">
        <div className="container-page">
          <div className="text-center"><p className="eyebrow mb-4">HOW TO READ</p><h2 className="section-title font-myeongjo">화력은 네 가지 이야기로 읽어요</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#786c63]">성분, 사용감, 피부 궁합, 정보 상태를 함께 보면 나에게 맞는 이유가 더 선명해져요.</p></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reportPillars.map(({ icon: Icon, title, description, href, linkLabel }) => (
              <article key={title} className="paper-card flex min-h-[250px] flex-col rounded-[24px] p-6">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#a6536812] text-[#a65368]"><Icon size={20} /></span>
                <h3 className="mt-5 font-myeongjo text-xl font-semibold">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-[#74675f]">{description}</p>
                <Link href={href} className="mt-5 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-[#98495d]">{linkLabel} <ArrowRight size={14} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-28">
        <div className="container-page">
          <div className="mb-9 flex items-end justify-between gap-5">
            <div><p className="eyebrow mb-4">START WITH ONE PRODUCT</p><h2 className="section-title font-myeongjo">마음에 닿는 제품부터<br className="sm:hidden" /> 만나보세요</h2><p className="mt-4 max-w-xl text-sm leading-7 text-[#786b63]">제품 카드는 핵심 화력을, 상세 리포트는 성분과 사용감, 피부 궁합을 더 깊게 보여드려요.</p></div>
            <Link href="/products" className="hidden items-center gap-1 text-sm font-semibold text-[#9b4a5d] sm:flex">모든 제품 <ArrowRight size={16} /></Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featuredProducts.map((product) => <ProductCard key={product.id} product={product} initialFavorited={favoriteIds.has(product.id)} isAuthenticated={favoriteState.isAuthenticated} returnTo="/" scoreLabel="성분 기준 점수" />)}</div>
          <Link href="/products" className="line-btn mt-7 w-full sm:hidden">모든 제품 보기</Link>
        </div>
      </section>

      <section className="pb-16 md:pb-28">
        <div className="container-page overflow-hidden rounded-[30px] border border-[#e5aebb35] bg-[#f9e1e7] text-[#382b30] shadow-[0_24px_60px_rgba(164,82,104,.1)]">
          <div className="grid lg:grid-cols-[1fr_1fr]">
            <div className="p-7 md:p-12">
              <p className="text-xs font-bold tracking-[.18em] text-[#a64f65]">COMPARE BY YOUR PURPOSE</p>
              <h2 className="mt-4 font-myeongjo text-3xl leading-snug md:text-4xl">나란히 보면<br />더 잘 보이는 차이</h2>
              <p className="mt-5 text-sm leading-7 text-[#765f67]">메이크업 궁합, 보습 지속력, 자극 부담처럼 지금 내게 중요한 항목을 골라 두 제품의 차이를 섬세하게 비교해 보세요.</p>
              <Link href="/compare" className="ink-btn mt-8">제품 비교 시작 <ArrowRight size={16} /></Link>
            </div>
            <div className="grid gap-3 bg-white/78 p-5 md:p-8">
              {[
                ["01", "같은 피부 조건", "두 제품 모두 동일한 프로필로 계산"],
                ["02", "항목별 차이", "강점과 주의점이 갈리는 지점을 표시"],
                ["03", "나에게 맞는 결론", "지금 중요한 포인트를 중심으로 해석"],
              ].map(([number, title, description]) => <div key={number} className="flex items-center gap-4 rounded-2xl border border-[#75564516] bg-white/72 p-4"><span className="font-myeongjo text-xl text-[#a65368]">{number}</span><div><strong className="font-myeongjo text-base">{title}</strong><p className="mt-1 text-xs leading-5 text-[#817168]">{description}</p></div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dfa6b51f] bg-white py-14 md:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center"><HeartHandshake className="mx-auto text-[#a65368]" size={34} strokeWidth={1.5} /><p className="eyebrow mt-5">BEAUTY, MADE PERSONAL</p><h2 className="mt-4 font-myeongjo text-3xl font-semibold md:text-4xl">좋은 화장품 선택은, 나를 아는 데서 시작돼요</h2><p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#75675f]">성분의 역할, 실제 사용감, 내 피부 컨디션을 차분히 연결해 복잡한 선택을 나만의 이야기로 바꿔드릴게요.</p></div>
          <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
            {["성분과 사용감을 함께", "정보가 적으면 솔직하게", "내 피부와의 궁합을 섬세하게"].map((text) => <div key={text} className="rounded-2xl bg-[#fff4f6] p-4 text-center text-sm font-semibold text-[#6b5857]"><CheckCircle2 className="mx-auto mb-2 text-[#a65368]" size={18} />{text}</div>)}
          </div>
          <div className="mt-7 text-center"><Link href="/principles" className="line-btn">화력 읽는 법 <ArrowRight size={16} /></Link></div>
        </div>
      </section>

      <section className="py-16 md:py-28">
        <div className="container-page relative overflow-hidden rounded-[28px] border border-[#e1a5b333] bg-[#fff0f3] px-5 py-12 text-center sm:rounded-[34px] sm:px-6 md:py-20">
          <div className="absolute left-[8%] top-8 text-5xl text-[#d58b7860]" aria-hidden="true">❀</div><div className="absolute bottom-8 right-[10%] text-4xl text-[#d58b7845]" aria-hidden="true">✿</div>
          <p className="eyebrow mb-4">BEGIN YOUR BEAUTY STORY</p>
          <h2 className="font-myeongjo text-3xl font-medium leading-snug md:text-5xl">내 피부에 맞는 이야기를<br />시작해 보세요.</h2>
          <p className="mt-5 text-sm leading-7 text-[#74675e]">최근 피부 상태를 먼저 체크하면, 이름이 낯선 브랜드도 성분이 잘 맞는 이유를 확인하며 고를 수 있어요.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/skin-check" className="ink-btn w-full sm:w-auto">1분 피부 체크 <ArrowRight size={17} /></Link><Link href="/products" className="line-btn w-full sm:w-auto">제품부터 둘러보기</Link></div>
        </div>
      </section>
    </>
  );
}
