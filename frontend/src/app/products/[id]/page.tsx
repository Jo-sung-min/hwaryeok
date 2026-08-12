import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Info, MessageCircle, ShoppingBag, Sparkles, TriangleAlert } from "lucide-react";
import { FavoriteButton, GradeSeal, InsightBadge, ProductCard, ProductVisual, ScoreRing } from "@/components/product-ui";
import { ingredients, products, scoreDetails } from "@/lib/data";

export function generateStaticParams() { return products.map(product => ({ id: product.id })); }

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find(item => item.id === id);
  if (!product) notFound();

  return (
    <div className="pb-24">
      <div className="container-page py-6 md:py-9">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm text-[#766960]"><ArrowLeft size={16} /> 화장품 목록</Link>
      </div>
      <section className="container-page">
        <div className="grid overflow-hidden rounded-[32px] border border-[#74513f1a] bg-[#fffaf2a8] lg:grid-cols-[.86fr_1.14fr]">
          <div className="relative min-h-[390px] lg:min-h-[590px]"><div className="absolute inset-0 [&>div]:h-full"><ProductVisual tone={product.tone} /></div><div className="absolute right-5 top-5"><FavoriteButton /></div></div>
          <div className="flex flex-col justify-center p-6 md:p-10 lg:p-14">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8e7468]">{product.brand} · {product.category}</p>
            <h1 className="mt-3 font-myeongjo text-3xl font-semibold leading-snug md:text-4xl">{product.name}</h1>
            <p className="mt-3 text-sm text-[#786a61]">50 ml · {product.price}</p>
            <div className="my-8 h-px bg-[#75564518]" />
            <div className="flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-[#7b6b61]">수부지 · 민감 피부인</p>
                <h2 className="mt-1 font-myeongjo text-2xl font-semibold">나의 화력</h2>
                <div className="mt-5 flex items-center gap-4"><GradeSeal grade={product.grade} /><div><strong className="font-myeongjo text-xl">매우 잘 맞아요</strong><p className="mt-1 text-xs text-[#89796e]">{product.benefit}에 특히 좋아요</p></div></div>
              </div>
              <ScoreRing score={product.score} size="small" />
            </div>
            <div className="mt-8 rounded-2xl border border-[#a763551a] bg-[#f6eadf] p-4 text-sm leading-7 text-[#675a52]"><Sparkles size={16} className="mr-2 inline text-[#a54f49]" />현재 피부와 매우 잘 맞는 제품이에요. 특히 <strong>속건조와 장벽 고민</strong>을 함께 챙길 수 있어요.</div>
            <div className="mt-6 flex gap-3"><button className="ink-btn flex-1"><ShoppingBag size={17} /> 구매처 보기</button><Link href="/compare" className="line-btn">비교하기</Link></div>
          </div>
        </div>
      </section>

      <section className="container-page py-20 md:py-28">
        <div className="mb-9 max-w-2xl"><InsightBadge /><h2 className="mt-4 section-title font-myeongjo">왜 나에게 1등급일까요?</h2><p className="mt-4 text-sm leading-7 text-[#796c63]">피부 프로필과 전성분을 함께 살펴, 좋은 점과 조심할 점을 숨김없이 알려드려요.</p></div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[26px] border border-[#76846d24] bg-[#edf1e84f] p-6 md:p-8"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#7b8973] text-white"><Check size={18} /></span><h3 className="font-myeongjo text-xl font-semibold">잘 맞는 이유</h3></div><ul className="mt-6 grid gap-4 text-sm leading-7 text-[#605e55]"><li>보습을 오래 잡아주는 성분 조합이 속건조에 잘 맞아요.</li><li>피부 장벽을 돕는 판테놀과 세라마이드가 충분해요.</li><li>민감한 피부가 부담스러워할 향료가 들어 있지 않아요.</li></ul></div>
          <div className="rounded-[26px] border border-[#c78e762a] bg-[#f4e4dc69] p-6 md:p-8"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#c1856f] text-white"><TriangleAlert size={17} /></span><h3 className="font-myeongjo text-xl font-semibold">이렇게 사용해보세요</h3></div><ul className="mt-6 grid gap-4 text-sm leading-7 text-[#685c55]"><li>유분감이 있는 편이라 여름에는 콩알만큼 덜어 쓰세요.</li><li>볼과 입가처럼 당기는 곳부터 얇게 펴 바르면 좋아요.</li><li>피부 상태에 따라 사용감은 달라질 수 있어요.</li></ul></div>
        </div>
      </section>

      <section className="border-y border-[#74513f14] bg-[#f3eadc91] py-20 md:py-24">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
            <div><p className="eyebrow mb-4">FIT DETAILS</p><h2 className="section-title font-myeongjo">피부 궁합을<br />한눈에 봐요</h2><p className="mt-5 text-sm leading-7 text-[#786b62]">좋은 점수는 길게, 부담과 위험 점수는 짧을수록 좋아요. 항목마다 의미가 다르게 읽히도록 구분했습니다.</p></div>
            <div className="grid gap-6">{scoreDetails.map(item => <div key={item.label}><div className="mb-2 flex items-end justify-between"><div><strong className="font-myeongjo text-lg">{item.label}</strong><span className={`ml-3 text-xs ${item.positive ? "text-[#71806b]" : "text-[#a06856]"}`}>{item.note}</span></div><strong className="font-myeongjo text-xl">{item.value}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-[#cfbdaa46]"><div className={`h-full rounded-full ${item.positive ? "bg-gradient-to-r from-[#9eaa92] to-[#70806d]" : "bg-gradient-to-r from-[#dfb29e] to-[#c1826d]"}`} style={{ width: `${item.value}%` }} /></div></div>)}</div>
          </div>
        </div>
      </section>

      <section className="container-page py-20 md:py-28">
        <div className="mb-9 flex items-end justify-between"><div><p className="eyebrow mb-4">INGREDIENT NOTE</p><h2 className="section-title font-myeongjo">성분도 쉬운 말로</h2></div><Link href="/ingredients" className="hidden items-center gap-1 text-sm font-semibold text-[#9b4a45] sm:flex">성분 사전 <ChevronRight size={17} /></Link></div>
        <div className="grid gap-3">{ingredients.map(item => <Link href="/ingredients" key={item.name} className="group flex flex-col justify-between gap-4 rounded-2xl border border-[#74513f17] bg-[#fffaf291] p-5 transition hover:border-[#9f705e4a] sm:flex-row sm:items-center"><div className="flex items-center gap-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg ${item.status === "good" ? "bg-[#8c9b8020] text-[#71806b]" : "bg-[#dca38d25] text-[#ad705c]"}`}>{item.status === "good" ? "✿" : "!"}</span><div><h3 className="font-myeongjo text-lg font-semibold">{item.name}</h3><p className="mt-1 text-xs text-[#89786d]">{item.role}</p></div></div><p className="max-w-md text-sm leading-6 text-[#70645c]">{item.description}</p><ChevronRight size={17} className="hidden text-[#9a8275] sm:block" /></Link>)}</div>
      </section>

      <section className="border-y border-[#74513f14] bg-[#fffaf3] py-20">
        <div className="container-page">
          <div className="mb-8 flex items-end justify-between"><div><p className="eyebrow mb-4">SKIN REVIEWS</p><h2 className="section-title font-myeongjo">나와 닮은 피부의 기록</h2></div><button className="line-btn hidden sm:flex"><MessageCircle size={16} /> 리뷰 남기기</button></div>
          <div className="grid gap-5 md:grid-cols-2">{[{type:"수부지 · 민감", period:"3주 사용", review:"속건조는 확실히 줄었고, 볼 쪽이 편안해졌어요. 다만 T존에는 아주 얇게 바르고 있어요."},{type:"복합성 · 장벽",period:"한 통 사용",review:"향이 없고 자극감이 적어서 피부가 예민한 날에도 손이 가요. 밤에 바르면 아침까지 촉촉해요."}].map((review,index)=><article key={index} className="paper-card rounded-[24px] p-6"><div className="flex items-center justify-between"><span className="rounded-full bg-[#a54f4910] px-3 py-1.5 text-xs font-semibold text-[#91443f]">{review.type}</span><span className="text-xs text-[#95857a]">{review.period}</span></div><p className="mt-5 font-myeongjo text-lg leading-8">“{review.review}”</p><div className="mt-5 flex items-center gap-2 text-xs text-[#82736a]"><span className="text-[#ca806d]">✿✿✿✿✿</span><span>재구매 의향 있어요</span></div></article>)}</div>
          <div className="mt-4 flex gap-2 rounded-xl bg-[#f4ebdd] p-3 text-[11px] leading-5 text-[#7d7066]"><Info size={15} className="mt-0.5 shrink-0" /> 리뷰는 개인의 사용 경험이며, 피부 상태와 사용 환경에 따라 다를 수 있어요.</div>
        </div>
      </section>

      <section className="container-page py-20"><h2 className="mb-8 font-myeongjo text-2xl font-semibold">함께 비교해볼 제품</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.filter(item => item.id !== product.id).slice(0,3).map(item => <ProductCard key={item.id} product={item} />)}</div></section>
    </div>
  );
}
