import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, FlaskConical, MessageCircle, ShoppingBag, Sparkles, TriangleAlert } from "lucide-react";
import { FavoriteButton, GradeSeal, InsightBadge, ProductCard, ProductVisual, ScoreRing } from "@/components/product-ui";
import { ApiRequestError, getAnalysis, getProduct, getProducts } from "@/lib/api";

const defaultProfile = {
  skinType: "수부지",
  concerns: ["속건조", "민감", "피부 장벽"],
};

export default async function ProductDetailPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;

  try {
    const [product, analysis, products] = await Promise.all([
      getProduct(id),
      getAnalysis({ productId: id, ...defaultProfile }),
      getProducts(),
    ]);
    const relatedProducts = products.filter((item) => item.id !== product.id).slice(0, 3);

    return (
      <div className="pb-24">
        <div className="container-page py-6 md:py-9">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm text-[#766960]"><ArrowLeft size={16} /> 화장품 목록</Link>
        </div>

        <section className="container-page">
          <div className="grid overflow-hidden rounded-[32px] border border-[#74513f1a] bg-[#fffaf2a8] lg:grid-cols-[.86fr_1.14fr]">
            <div className="relative min-h-[390px] lg:min-h-[590px]">
              <div className="absolute inset-0 [&>div]:h-full"><ProductVisual tone={product.tone} /></div>
              <div className="absolute right-5 top-5"><FavoriteButton /></div>
            </div>
            <div className="flex flex-col justify-center p-6 md:p-10 lg:p-14">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8e7468]">{product.brand} · {product.category}</p>
              <h1 className="mt-3 font-myeongjo text-3xl font-semibold leading-snug md:text-4xl">{product.name}</h1>
              <p className="mt-3 text-sm text-[#786a61]">{product.price}</p>
              <div className="my-8 h-px bg-[#75564518]" />
              <div className="flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm text-[#7b6b61]">{analysis.skinType} · {analysis.concerns.join(" · ")} 피부인</p>
                  <h2 className="mt-1 font-myeongjo text-2xl font-semibold">나의 화력</h2>
                  <div className="mt-5 flex items-center gap-4">
                    <GradeSeal grade={analysis.grade} />
                    <div><strong className="font-myeongjo text-xl">{analysis.verdict}</strong><p className="mt-1 text-xs text-[#89796e]">{product.benefit}에 특히 좋아요</p></div>
                  </div>
                </div>
                <ScoreRing score={analysis.score} size="small" />
              </div>
              <div className="mt-8 rounded-2xl border border-[#a763551a] bg-[#f6eadf] p-4 text-sm leading-7 text-[#675a52]"><Sparkles size={16} className="mr-2 inline text-[#a54f49]" />{analysis.highlights[0]}</div>
              <div className="mt-6 flex gap-3"><button className="ink-btn flex-1"><ShoppingBag size={17} /> 구매처 보기</button><Link href={`/compare?left=${product.id}`} className="line-btn">비교하기</Link></div>
            </div>
          </div>
        </section>

        <section className="container-page py-20 md:py-28">
          <div className="mb-9 max-w-2xl"><InsightBadge /><h2 className="mt-4 section-title font-myeongjo">왜 나에게 {analysis.grade}등급일까요?</h2><p className="mt-4 text-sm leading-7 text-[#796c63]">선택한 피부 프로필과 제품 특성을 함께 계산해 좋은 점과 조심할 점을 알려드려요.</p></div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[26px] border border-[#76846d24] bg-[#edf1e84f] p-6 md:p-8">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#7b8973] text-white"><Check size={18} /></span><h3 className="font-myeongjo text-xl font-semibold">잘 맞는 이유</h3></div>
              <ul className="mt-6 grid gap-4 text-sm leading-7 text-[#605e55]">{analysis.highlights.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
            <div className="rounded-[26px] border border-[#c78e762a] bg-[#f4e4dc69] p-6 md:p-8">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#c1856f] text-white"><TriangleAlert size={17} /></span><h3 className="font-myeongjo text-xl font-semibold">이렇게 사용해보세요</h3></div>
              <ul className="mt-6 grid gap-4 text-sm leading-7 text-[#685c55]">{analysis.cautions.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className="border-y border-[#74513f14] bg-[#f3eadc91] py-20 md:py-24">
          <div className="container-page grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
            <div><p className="eyebrow mb-4">FIT DETAILS</p><h2 className="section-title font-myeongjo">피부 궁합을<br />한눈에 봐요</h2><p className="mt-5 text-sm leading-7 text-[#786b62]">좋은 점수는 길게, 부담과 위험 점수는 짧을수록 좋아요.</p></div>
            <div className="grid gap-6">{analysis.details.map((item) => <div key={item.label}><div className="mb-2 flex items-end justify-between"><div><strong className="font-myeongjo text-lg">{item.label}</strong><span className={`ml-3 text-xs ${item.positive ? "text-[#71806b]" : "text-[#a06856]"}`}>{item.note}</span></div><strong className="font-myeongjo text-xl">{item.value}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-[#cfbdaa46]"><div className={`h-full rounded-full ${item.positive ? "bg-gradient-to-r from-[#9eaa92] to-[#70806d]" : "bg-gradient-to-r from-[#dfb29e] to-[#c1826d]"}`} style={{ width: `${item.value}%` }} /></div></div>)}</div>
          </div>
        </section>

        <section className="container-page grid gap-5 py-20 md:grid-cols-2 md:py-28">
          <div className="paper-card rounded-[26px] p-7 md:p-9"><FlaskConical className="text-[#8a987f]" /><p className="eyebrow mb-3 mt-6">INGREDIENT NOTE</p><h2 className="font-myeongjo text-2xl font-semibold">제품별 전성분 분석 준비 중</h2><p className="mt-3 text-sm leading-7 text-[#796c63]">다음 단계에서 제품과 성분 데이터를 연결해 실제 함유 성분만 보여드릴게요.</p><Link href="/ingredients" className="line-btn mt-6">성분 사전 보기 <ChevronRight size={16} /></Link></div>
          <div className="paper-card rounded-[26px] p-7 md:p-9"><MessageCircle className="text-[#c17f69]" /><p className="eyebrow mb-3 mt-6">SKIN REVIEWS</p><h2 className="font-myeongjo text-2xl font-semibold">실사용 리뷰 준비 중</h2><p className="mt-3 text-sm leading-7 text-[#796c63]">회원 기능과 리뷰 API가 연결되면 피부 타입과 사용 기간을 확인할 수 있어요.</p><span className="mt-6 inline-flex rounded-full bg-[#a54f4910] px-4 py-2 text-xs font-semibold text-[#934640]">리뷰 기능 예정</span></div>
        </section>

        {relatedProducts.length > 0 && <section className="container-page pb-20"><h2 className="mb-8 font-myeongjo text-2xl font-semibold">함께 비교해볼 제품</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
      </div>
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
}
