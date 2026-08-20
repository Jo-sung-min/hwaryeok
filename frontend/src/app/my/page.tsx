import Link from "next/link";
import { Activity, ArrowRight, Clock3, Droplets, Flower2, Heart, PencilLine, Scale, Settings, Shield, Sparkles, Stethoscope, SunMedium, Wind } from "lucide-react";
import { ProductCard } from "@/components/product-ui";
import { IngredientPreferencesForm } from "@/app/my/ingredient-preferences-form";
import { getFeaturedIngredients, getRanking, getUserComparisonProducts, getUserFavorites, getUserPreferredIngredients, getUserRecentProducts, getUserSkinProfile } from "@/lib/api";
import { readAuthTokens, requireSession } from "@/lib/auth-session";

const skinSeal: Record<string, string> = {
  건성: "乾",
  지성: "油",
  복합성: "複",
  수부지: "水",
  중성: "中",
  민감: "敏",
};

export default async function MyPage() {
  const user = await requireSession("/my");
  const { accessToken } = await readAuthTokens();
  const featuredIngredients = await getFeaturedIngredients(10);
  const [profile, favorites, preferredIngredients, recentProducts, comparisonProducts] = accessToken
    ? await Promise.all([getUserSkinProfile(accessToken), getUserFavorites(accessToken), getUserPreferredIngredients(accessToken), loadRecentProducts(accessToken), loadComparisonProducts(accessToken)])
    : [
        { configured: false, skinType: null, hydrationLevel: null, oilinessLevel: null, sensitivityLevel: null, breakoutFrequency: null, profileVersion: 0, cleansingTightness: null, rednessFrequency: null, poreLevel: null, texturePreference: null, routineComplexity: null, sunscreenUsage: null, reactionTriggers: [], breakoutZones: [], environments: [], concerns: [], createdAt: null, updatedAt: null },
        { content: [], totalElements: 0 },
        { content: [], totalElements: 0 },
        { content: [], totalElements: 0, error: null },
        { content: [], totalElements: 0, error: null },
      ];
  const ranking = await getRanking(profile.configured ? profile : "수부지", 3);
  const profileTitle = profile.configured ? `${profile.skinType} 피부` : "피부 프로필을 등록해 주세요";
  const profileDetails = [
    { icon: Droplets, label: "수분", value: balanceLabel(profile.hydrationLevel, "수분") },
    { icon: SunMedium, label: "유분", value: balanceLabel(profile.oilinessLevel, "유분") },
    { icon: Shield, label: "민감도", value: sensitivityLabel(profile.sensitivityLevel) },
    { icon: Activity, label: "트러블", value: breakoutLabel(profile.breakoutFrequency) },
    { icon: Flower2, label: "선호 제형", value: textureLabel(profile.texturePreference) },
    { icon: Wind, label: "생활 환경", value: profile.environments.length ? `${profile.environments.length}개 반영` : "선택 없음" },
  ];

  return (
    <div className="min-h-screen pb-24">
      <section className="border-b border-[#dfa6b51f] bg-[#fff1f4] py-10 md:py-16">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-4">MY HWA:RYEOK</p>
              <h1 className="text-balance font-myeongjo text-[34px] font-medium leading-tight sm:text-4xl">{user.nickname}님의 피부가<br className="sm:hidden" /> 피어나는 곳</h1>
              <p className="mt-4 text-sm text-[#75695f]">저장한 피부 정보와 찜·비교·최근 본 제품을 한곳에서 살펴보세요.</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {user.role === "ADMIN" && <Link href="/admin" className="line-btn w-full self-start sm:w-auto"><Shield size={16} /> 관리자 센터</Link>}
              <Link href="/profile" className="line-btn w-full self-start sm:w-auto"><PencilLine size={16} /> {profile.configured ? "내 프로필 보기" : "피부 정보 등록"}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page -mt-1 py-9 md:py-12">
        <div className="paper-card grid overflow-hidden rounded-[24px] sm:rounded-[28px] md:grid-cols-[1.15fr_.85fr]">
          <div className="p-5 sm:p-6 md:p-9">
            <span className="rounded-full bg-[#a54f4910] px-3 py-1.5 text-xs font-semibold text-[#984944]">나의 피부 프로필</span>
            <div className="mt-6 flex items-center gap-5">
              <span className="seal h-16 w-16 font-myeongjo text-2xl">{profile.skinType ? skinSeal[profile.skinType] ?? "花" : "花"}</span>
              <div>
                <h2 className="font-myeongjo text-2xl font-semibold">{profileTitle}</h2>
                <p className="mt-2 text-xs text-[#82736a]">{profile.configured ? profile.profileVersion >= 2 ? "세부 관찰 정보로 제품별 화력을 계산해요." : "기본 정보가 저장되어 있어요. 세부 문항을 보완할 수 있어요." : "피부 타입과 고민을 알려주시면 화력을 맞춰드려요."}</p>
              </div>
            </div>
            {profile.concerns.length > 0 ? (
              <div className="mt-7 flex flex-wrap gap-2">{profile.concerns.map((item) => <span key={item} className="rounded-full border border-[#74513f18] bg-[#fffaf3] px-3 py-2 text-xs text-[#6e625a]">{item}</span>)}</div>
            ) : (
              <Link href="/profile" className="mt-7 inline-flex items-center gap-1 text-xs font-semibold text-[#9b4a45]">피부 프로필 등록하기 <ArrowRight size={14} /></Link>
            )}
            {profile.configured && <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">{profileDetails.map(({ icon: Icon, label, value }) => <div key={label} className="flex min-w-0 items-center gap-2 rounded-xl border border-[#74513f12] bg-white/55 p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e7c4b92b] text-[#9c514a]"><Icon size={15} /></span><span className="min-w-0"><small className="block text-[9px] text-[#94857b]">{label}</small><strong className="mt-0.5 block truncate text-[11px] text-[#5f554f]">{value}</strong></span></div>)}</div>}
          </div>
          <div className="border-t border-[#e3b1bd33] bg-[#fff1f4] p-5 sm:p-6 md:border-l md:border-t-0 md:p-9">
            <div className="flex items-center gap-2 text-xs font-bold text-[#9b4a45]"><Sparkles size={14} /> 나의 화력 기록</div>
            <p className="mt-4 font-myeongjo text-xl leading-8">{favorites.totalElements > 0 ? `${favorites.totalElements}개의 제품을 찜해두었어요.` : "아직 찜한 제품이 없어요."}<br />마음에 드는 화장품을 천천히 모아보세요.</p>
            <Link href="/products" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#8e4842]">맞춤 제품 둘러보기 <ArrowRight size={14} /></Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Heart} label="찜한 제품" value={String(favorites.totalElements)} ready />
          <StatCard icon={Scale} label="비교 저장 제품" value={comparisonProducts.error ? "확인 필요" : String(comparisonProducts.totalElements)} ready={!comparisonProducts.error} />
          <StatCard icon={Clock3} label="최근 본 제품" value={recentProducts.error ? "확인 필요" : String(recentProducts.totalElements)} ready={!recentProducts.error} />
        </div>

        <section className="mt-10 md:mt-14">
          <IngredientPreferencesForm
            ingredients={featuredIngredients}
            initialSelected={preferredIngredients.content.map((item) => item.ingredient.id)}
          />
        </section>

        <section className="mt-10 md:mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><h2 className="font-myeongjo text-2xl font-semibold">저장한 제품 비교</h2><p className="mt-2 text-xs text-[#82736a]">비교 화면에서 고른 2~3개 제품과 순서를 그대로 보관해요.</p></div>
            {comparisonProducts.totalElements >= 2 && <Link href={comparisonHref(comparisonProducts.content)} className="shrink-0 text-xs font-semibold text-[#9b4a45]">비교 이어보기</Link>}
          </div>
          {comparisonProducts.error ? (
            <div className="rounded-[24px] border border-[#c78e762a] bg-[#fff8ee] px-5 py-10 text-center sm:px-6 sm:py-12">
              <Scale className="mx-auto text-[#b77762]" size={30} strokeWidth={1.5} />
              <h3 className="mt-4 font-myeongjo text-xl font-semibold">저장한 비교를 잠시 불러오지 못했어요.</h3>
              <p className="mt-2 text-sm text-[#7c6f66]">찜과 최근 본 기록은 그대로 이용할 수 있어요. 잠시 후 다시 확인해 주세요.</p>
              <Link href="/my" className="line-btn mt-6 w-full sm:w-auto">다시 불러오기</Link>
            </div>
          ) : comparisonProducts.content.length >= 2 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {comparisonProducts.content.map(({ product }) => <ProductCard key={product.id} product={product} initialFavorited={favorites.content.some((item) => item.product.id === product.id)} isAuthenticated returnTo="/my" />)}
            </div>
          ) : (
            <div className="paper-card rounded-[24px] px-5 py-12 text-center sm:rounded-[26px] sm:px-6 sm:py-14">
              <Scale className="mx-auto text-[#c58a7c]" size={32} strokeWidth={1.5} />
              <h3 className="mt-5 font-myeongjo text-2xl font-semibold">저장한 비교가 아직 없어요.</h3>
              <p className="mt-3 text-sm text-[#7c6f66]">비교 화면에서 제품 2~3개를 고른 뒤 내 계정에 저장해 보세요.</p>
              <Link href="/compare" className="ink-btn mt-7 w-full sm:w-auto">제품 비교 시작 <ArrowRight size={16} /></Link>
            </div>
          )}
        </section>

        <section className="mt-10 md:mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><h2 className="font-myeongjo text-2xl font-semibold">최근 본 제품</h2><p className="mt-2 text-xs text-[#82736a]">상세 화면에서 확인한 제품을 최신순으로 최대 6개 보여드려요.</p></div>
            {recentProducts.totalElements > 0 && <span className="shrink-0 text-xs font-semibold text-[#9b4a45]">총 {recentProducts.totalElements}개</span>}
          </div>
          {recentProducts.error ? (
            <div className="rounded-[24px] border border-[#c78e762a] bg-[#fff8ee] px-5 py-10 text-center sm:px-6 sm:py-12">
              <Clock3 className="mx-auto text-[#b77762]" size={30} strokeWidth={1.5} />
              <h3 className="mt-4 font-myeongjo text-xl font-semibold">최근 본 기록을 잠시 불러오지 못했어요.</h3>
              <p className="mt-2 text-sm text-[#7c6f66]">다른 마이화력 정보는 그대로 이용할 수 있어요. 잠시 후 다시 확인해 주세요.</p>
              <Link href="/my" className="line-btn mt-6 w-full sm:w-auto">다시 불러오기</Link>
            </div>
          ) : recentProducts.content.length > 0 ? (
            <div className="scrollbar-hide -mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
              {recentProducts.content.map(({ product }) => <div key={product.id} className="min-w-[82vw] max-w-[320px] snap-center sm:min-w-0 sm:max-w-none"><ProductCard product={product} initialFavorited={favorites.content.some((item) => item.product.id === product.id)} isAuthenticated returnTo="/my" /></div>)}
            </div>
          ) : (
            <div className="paper-card rounded-[24px] px-5 py-12 text-center sm:rounded-[26px] sm:px-6 sm:py-14">
              <Clock3 className="mx-auto text-[#c58a7c]" size={32} strokeWidth={1.5} />
              <h3 className="mt-5 font-myeongjo text-2xl font-semibold">아직 살펴본 제품이 없어요.</h3>
              <p className="mt-3 text-sm text-[#7c6f66]">제품 상세를 열어보면 최근 본 순서대로 여기에 기록돼요.</p>
              <Link href="/products" className="line-btn mt-7 w-full sm:w-auto">첫 제품 찾아보기 <ArrowRight size={16} /></Link>
            </div>
          )}
        </section>

        <section className="mt-10 md:mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><h2 className="font-myeongjo text-2xl font-semibold">찜한 제품</h2><p className="mt-2 text-xs text-[#82736a]">하트를 눌러 저장한 제품을 최신순으로 보여드려요.</p></div>
            {favorites.totalElements > 0 && <span className="text-xs font-semibold text-[#9b4a45]">총 {favorites.totalElements}개</span>}
          </div>
          {favorites.content.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{favorites.content.map(({ product }) => <ProductCard key={product.id} product={product} initialFavorited isAuthenticated returnTo="/my" />)}</div>
          ) : (
            <div className="paper-card rounded-[24px] px-5 py-12 text-center sm:rounded-[26px] sm:px-6 sm:py-16">
              <Heart className="mx-auto text-[#c58a7c]" size={32} strokeWidth={1.5} />
              <h3 className="mt-5 font-myeongjo text-2xl font-semibold">마음에 담은 제품이 아직 없어요.</h3>
              <p className="mt-3 text-sm text-[#7c6f66]">제품 카드의 하트를 누르면 여기에 안전하게 보관돼요.</p>
              <Link href="/products" className="ink-btn mt-7 w-full sm:w-auto">화장품 둘러보기 <ArrowRight size={16} /></Link>
            </div>
          )}
        </section>

        <section className="mt-10 md:mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><h2 className="font-myeongjo text-2xl font-semibold">나의 추천 제품</h2><p className="mt-2 text-xs text-[#82736a]">{profile.configured ? `${profile.skinType} 피부 기준 화력 상위 제품이에요.` : "프로필 등록 전에는 수부지 기준으로 보여드려요."}</p></div>
            <Link href="/ranking" className="text-xs font-semibold text-[#9b4a45]">랭킹 보기</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{ranking.map((product) => <ProductCard key={product.id} product={product} initialFavorited={favorites.content.some((item) => item.product.id === product.id)} isAuthenticated returnTo="/my" />)}</div>
        </section>

        <div className="mt-10 rounded-[24px] border border-[#e3b1bd33] bg-[#fff1f4] p-5 sm:mt-14 sm:flex sm:items-center sm:justify-between sm:rounded-[26px] sm:p-6">
          <div><div className="flex items-center gap-2"><Settings size={16} /><h2 className="font-myeongjo text-xl font-semibold">피부 정보가 달라졌나요?</h2></div><p className="mt-2 text-xs leading-6 text-[#7c6f66]">프로필을 바꾸면 모든 화력 점수와 추천 순위가 새롭게 계산돼요.</p></div>
          <Link href="/profile" className="line-btn mt-5 w-full sm:mt-0 sm:w-auto">프로필 확인·수정</Link>
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded-[24px] border border-[#e4c5cd] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div><div className="flex items-center gap-2"><Stethoscope size={17} className="text-[#a45166]" /><h2 className="font-myeongjo text-xl font-semibold">의료진으로 활동하시나요?</h2></div><p className="mt-2 text-xs leading-6 text-[#7c6f74]">인증 후 화장품과 성분 질문에 전문가 답변을 남길 수 있어요.</p></div>
          <Link href="/experts/apply" className="line-btn w-full sm:w-auto">전문가 인증 확인</Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, ready = false }: { icon: typeof Heart; label: string; value: string; ready?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#74513f17] bg-[#fffaf287] p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e7c4b92b] text-[#9c514a]"><Icon size={17} /></span>
        <strong className={`font-myeongjo ${ready ? "text-2xl" : "text-sm text-[#9a8b80]"}`}>{value}</strong>
      </div>
      <p className="mt-4 text-xs text-[#7d7067]">{label}</p>
    </div>
  );
}

async function loadRecentProducts(accessToken: string) {
  try {
    const result = await getUserRecentProducts(accessToken);
    return { ...result, error: null as string | null };
  } catch {
    return { content: [], totalElements: 0, error: "RECENT_PRODUCTS_UNAVAILABLE" };
  }
}

async function loadComparisonProducts(accessToken: string) {
  try {
    const result = await getUserComparisonProducts(accessToken);
    return { ...result, error: null as string | null };
  } catch {
    return { content: [], totalElements: 0, error: "COMPARISON_PRODUCTS_UNAVAILABLE" };
  }
}

function comparisonHref(content: { product: { id: string } }[]) {
  const search = new URLSearchParams();
  if (content[0]) search.set("left", content[0].product.id);
  if (content[1]) search.set("right", content[1].product.id);
  if (content[2]) search.set("third", content[2].product.id);
  return `/compare?${search}`;
}

function balanceLabel(level: "LOW" | "BALANCED" | "HIGH" | null, kind: "수분" | "유분") {
  if (level === "LOW") return `${kind} 적음`;
  if (level === "HIGH") return `${kind} 많음`;
  return `${kind} 보통`;
}

function sensitivityLabel(level: "LOW" | "MEDIUM" | "HIGH" | null) {
  if (level === "LOW") return "낮음";
  if (level === "HIGH") return "높음";
  return "보통";
}

function breakoutLabel(value: "RARE" | "OCCASIONAL" | "FREQUENT" | null) {
  if (value === "RARE") return "거의 없음";
  if (value === "FREQUENT") return "자주";
  return "가끔";
}

function textureLabel(value: "LIGHT" | "BALANCED" | "RICH" | null) {
  if (value === "LIGHT") return "산뜻한 제형";
  if (value === "RICH") return "리치한 제형";
  return "균형 제형";
}
