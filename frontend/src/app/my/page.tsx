import Link from "next/link";
import { ArrowRight, Clock3, Heart, PencilLine, Scale, Settings, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-ui";
import { getRanking, getUserFavorites, getUserSkinProfile } from "@/lib/api";
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
  const [profile, favorites] = accessToken
    ? await Promise.all([getUserSkinProfile(accessToken), getUserFavorites(accessToken)])
    : [{ configured: false, skinType: null, concerns: [], createdAt: null, updatedAt: null }, { content: [], totalElements: 0 }];
  const ranking = await getRanking(profile.skinType ?? "수부지", 3);
  const profileTitle = profile.configured ? `${profile.skinType} 피부` : "피부 프로필을 등록해 주세요";

  return (
    <div className="min-h-screen pb-24">
      <section className="border-b border-[#74513f16] bg-[#eee2d2a6] py-12 md:py-16">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-4">MY HWA:RYEOK</p>
              <h1 className="font-myeongjo text-4xl font-medium">{user.nickname}님의 피부가<br className="sm:hidden" /> 피어나는 곳</h1>
              <p className="mt-4 text-sm text-[#75695f]">저장한 피부 정보와 찜한 제품을 한곳에서 살펴보세요.</p>
            </div>
            <Link href="/profile" className="line-btn self-start"><PencilLine size={16} /> 피부 정보 수정</Link>
          </div>
        </div>
      </section>

      <section className="container-page -mt-1 py-9 md:py-12">
        <div className="paper-card grid overflow-hidden rounded-[28px] md:grid-cols-[1.15fr_.85fr]">
          <div className="p-6 md:p-9">
            <span className="rounded-full bg-[#a54f4910] px-3 py-1.5 text-xs font-semibold text-[#984944]">나의 피부 프로필</span>
            <div className="mt-6 flex items-center gap-5">
              <span className="seal h-16 w-16 font-myeongjo text-2xl">{profile.skinType ? skinSeal[profile.skinType] ?? "花" : "花"}</span>
              <div>
                <h2 className="font-myeongjo text-2xl font-semibold">{profileTitle}</h2>
                <p className="mt-2 text-xs text-[#82736a]">{profile.configured ? "저장한 정보로 제품별 화력을 계산해요." : "피부 타입과 고민을 알려주시면 화력을 맞춰드려요."}</p>
              </div>
            </div>
            {profile.concerns.length > 0 ? (
              <div className="mt-7 flex flex-wrap gap-2">{profile.concerns.map((item) => <span key={item} className="rounded-full border border-[#74513f18] bg-[#fffaf3] px-3 py-2 text-xs text-[#6e625a]">{item}</span>)}</div>
            ) : (
              <Link href="/profile" className="mt-7 inline-flex items-center gap-1 text-xs font-semibold text-[#9b4a45]">피부 프로필 등록하기 <ArrowRight size={14} /></Link>
            )}
          </div>
          <div className="border-t border-[#74513f16] bg-[#f3e9db] p-6 md:border-l md:border-t-0 md:p-9">
            <div className="flex items-center gap-2 text-xs font-bold text-[#9b4a45]"><Sparkles size={14} /> 나의 화력 기록</div>
            <p className="mt-4 font-myeongjo text-xl leading-8">{favorites.totalElements > 0 ? `${favorites.totalElements}개의 제품을 찜해두었어요.` : "아직 찜한 제품이 없어요."}<br />마음에 드는 화장품을 천천히 모아보세요.</p>
            <Link href="/products" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#8e4842]">맞춤 제품 둘러보기 <ArrowRight size={14} /></Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Heart} label="찜한 제품" value={String(favorites.totalElements)} ready />
          <StatCard icon={Scale} label="비교한 제품" value="준비 중" />
          <StatCard icon={Clock3} label="최근 본 제품" value="준비 중" />
        </div>

        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><h2 className="font-myeongjo text-2xl font-semibold">찜한 제품</h2><p className="mt-2 text-xs text-[#82736a]">하트를 눌러 저장한 제품을 최신순으로 보여드려요.</p></div>
            {favorites.totalElements > 0 && <span className="text-xs font-semibold text-[#9b4a45]">총 {favorites.totalElements}개</span>}
          </div>
          {favorites.content.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{favorites.content.map(({ product }) => <ProductCard key={product.id} product={product} initialFavorited isAuthenticated returnTo="/my" />)}</div>
          ) : (
            <div className="paper-card rounded-[26px] px-6 py-16 text-center">
              <Heart className="mx-auto text-[#c58a7c]" size={32} strokeWidth={1.5} />
              <h3 className="mt-5 font-myeongjo text-2xl font-semibold">마음에 담은 제품이 아직 없어요.</h3>
              <p className="mt-3 text-sm text-[#7c6f66]">제품 카드의 하트를 누르면 여기에 안전하게 보관돼요.</p>
              <Link href="/products" className="ink-btn mt-7">화장품 둘러보기 <ArrowRight size={16} /></Link>
            </div>
          )}
        </section>

        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><h2 className="font-myeongjo text-2xl font-semibold">나의 추천 제품</h2><p className="mt-2 text-xs text-[#82736a]">{profile.configured ? `${profile.skinType} 피부 기준 화력 상위 제품이에요.` : "프로필 등록 전에는 수부지 기준으로 보여드려요."}</p></div>
            <Link href="/ranking" className="text-xs font-semibold text-[#9b4a45]">랭킹 보기</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{ranking.map((product) => <ProductCard key={product.id} product={product} initialFavorited={favorites.content.some((item) => item.product.id === product.id)} isAuthenticated returnTo="/my" />)}</div>
        </section>

        <div className="mt-14 rounded-[26px] border border-[#74513f18] bg-[#f3eadc87] p-6 sm:flex sm:items-center sm:justify-between">
          <div><div className="flex items-center gap-2"><Settings size={16} /><h2 className="font-myeongjo text-xl font-semibold">피부 정보가 달라졌나요?</h2></div><p className="mt-2 text-xs leading-6 text-[#7c6f66]">프로필을 바꾸면 모든 화력 점수와 추천 순위가 새롭게 계산돼요.</p></div>
          <Link href="/profile" className="line-btn mt-5 sm:mt-0">다시 분석하기</Link>
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
