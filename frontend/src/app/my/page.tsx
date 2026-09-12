import Link from "next/link";
import { ChevronDown, ChevronRight, Settings, Flame, Heart, KeyRound, LogOut, Mail, MessageSquare, Scale } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { IngredientPreferencesForm } from "./ingredient-preferences-form";
import { MySkinSummary } from "./my-skin-summary";
import { MyTabs } from "./my-tabs";
import { PasswordChangeForm } from "./password-change-form";
import { FavoriteButton } from "@/components/product-ui";
import { getFeaturedIngredients, getReviewerProfile, getUserComparisonProducts, getUserFavorites, getUserPreferredIngredients, getUserRecentProducts, getUserSkinProfile } from "@/lib/api";
import { readAuthTokens, requireSession } from "@/lib/auth-session";
import type { Product } from "@/lib/types";
import styles from "./my.module.css";

export default async function MyPage() {
  const user = await requireSession("/my");
  const { accessToken } = await readAuthTokens();
  const [profile, favorites, preferred, recent, comparison, reviewer, ingredients] = await Promise.all([
    accessToken ? getUserSkinProfile(accessToken).catch(() => null) : null,
    accessToken ? getUserFavorites(accessToken).catch(() => null) : null,
    accessToken ? getUserPreferredIngredients(accessToken).catch(() => null) : null,
    accessToken ? getUserRecentProducts(accessToken).catch(() => null) : null,
    accessToken ? getUserComparisonProducts(accessToken).catch(() => null) : null,
    getReviewerProfile(user.id).catch(() => null),
    getFeaturedIngredients(10).catch(() => []),
  ]);
  const stats = [
    { label: "작성 리뷰", value: reviewer?.reviewCount, icon: MessageSquare, href: `/reviewers/${user.id}` },
    { label: "리뷰 화력", value: reviewer?.reviewFirepower, icon: Flame, href: `/reviewers/${user.id}` },
    { label: "찜한 제품", value: favorites?.totalElements, icon: Heart, href: "#favorites" },
    { label: "비교 저장", value: comparison?.totalElements, icon: Scale, href: "#comparison" },
  ];
  const compareSearch = new URLSearchParams();
  comparison?.content.slice(0, 3).forEach(({ product }, index) => compareSearch.set(["left", "right", "third"][index], product.id));
  const editableIngredients = [...new Map([...ingredients, ...(preferred?.content.map(row => row.ingredient) ?? [])].map(item => [item.id, item])).values()];

  return <div className={styles.page}>
    <header className={styles.header}>
      <div className={styles.avatar} aria-hidden="true">{user.nickname.slice(0, 1)}</div>
      <div className={styles.identity}><p className={styles.eyebrow}>MY HWA:RYEOK</p><h1>{user.nickname}님의 마이화력</h1><p>내 피부와 나의 기록, 한눈에.</p></div>
      <Link href="/skin-check" className={styles.iconButton} aria-label="나의 성분찾기 설정"><Settings size={19} /></Link>
    </header>
    <MyTabs active="overview" />
    <div className={styles.stats}>{stats.map(({ label, value, icon: Icon, href }) => <Link href={href} key={label}><Icon size={16} /><strong>{value == null ? "—" : Number.isInteger(value) ? value : value.toFixed(1)}</strong><span>{label}</span></Link>)}</div>

    <MySkinSummary profile={profile} userId={user.id} />

    <section className={styles.section}>
      <div className={styles.sectionHead}><h2>나의 관심 성분</h2><span className={styles.muted}>{preferred?.totalElements ?? "—"}개</span></div>
      <div className={styles.tags}>{preferred === null ? <p className={styles.muted}>관심 성분을 불러오지 못했어요.</p> : preferred.content.length ? preferred.content.map(({ ingredient }) => <Link href={`/ingredients/${ingredient.id}`} key={ingredient.id}>{ingredient.name}</Link>) : <p className={styles.muted}>알아보고 싶은 성분을 골라두세요.</p>}</div>
      {preferred && editableIngredients.length > 0 && <details className={styles.details}><summary>관심 성분 편집</summary><IngredientPreferencesForm ingredients={editableIngredients} initialSelected={preferred.content.map(row => row.ingredient.id)} /></details>}
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHead}><h2>나의 활동</h2></div>
      <MenuRow href="/my/reviewer-profile" title="내 리뷰어 소개" detail="소개·블로그·Instagram 공개 연결 관리" />
      <MenuRow href={`/reviewers/${user.id}`} title="작성 리뷰와 받은 화력" detail={reviewer ? `리뷰 ${reviewer.reviewCount}개 · 받은 평가 ${reviewer.receivedRatingCount}개` : "리뷰 기록 확인"} />
      <MenuRow href="/my/usage-videos" title="내 사용법 영상" detail="영상·유튜브 채널 관리 및 승인 상태" />
    </section>

    <ProductList id="favorites" title="찜한 제품" items={favorites?.content} count={favorites?.totalElements} favorite />
    <ProductList id="comparison" title="비교 저장" items={comparison?.content} count={comparison?.totalElements} href={`/compare${compareSearch.size ? `?${compareSearch}` : ""}`} linkLabel="비교 열기" />
    <ProductList id="recent" title="최근 본 제품" items={recent?.content} count={recent?.totalElements} />

    <section className={styles.section}><div className={styles.sectionHead}><h2>설정과 도움말</h2></div>
      <div className={styles.accountCard} role="group" aria-labelledby="my-account-heading">
        <div className={styles.accountHead}><h3 id="my-account-heading">회원정보</h3><span>{user.authMethod.toLowerCase() === "kakao" ? "카카오" : "이메일"}</span></div>
        <div className={styles.accountIdentity}>
          <span className={styles.accountIcon} aria-hidden="true"><Mail size={17} /></span>
          <span><small>로그인 계정</small><strong>{user.email ?? "카카오 계정"}</strong></span>
        </div>
        {user.passwordChangeAvailable ? (
          <details className={styles.passwordDetails}>
            <summary><span><KeyRound size={16} aria-hidden="true" />비밀번호 변경</span><ChevronDown size={16} aria-hidden="true" /></summary>
            <PasswordChangeForm />
          </details>
        ) : (
          <p className={styles.oauthPasswordNotice}><KeyRound size={16} aria-hidden="true" /><span>비밀번호는 카카오에서 관리해요.</span></p>
        )}
        <form action={logoutAction} className={styles.logoutForm}>
          <button type="submit" className={styles.logoutButton}><LogOut size={16} aria-hidden="true" />로그아웃</button>
        </form>
      </div>
      <MenuRow href="/skin-check" title="나의 성분찾기" detail="피부 정보 확인·수정" />
      <MenuRow href="/experts/apply" title="전문가 인증" />
      {user.role === "ADMIN" && <MenuRow href="/admin" title="관리자 센터" />}
      <MenuRow href="/privacy" title="개인정보처리방침" />
    </section>
  </div>;
}

function MenuRow({ href, title, detail }: { href: string; title: string; detail?: string }) {
  return <Link href={href} className={styles.menuRow}><span><strong>{title}</strong>{detail && <small>{detail}</small>}</span><ChevronRight size={16} /></Link>;
}
function ProductList({ id, title, items, count, href, linkLabel, favorite = false }: { id: string; title: string; items?: { product: Product }[]; count?: number; href?: string; linkLabel?: string; favorite?: boolean }) {
  function row({ product }: { product: Product }) { return <li key={product.id} className={styles.productRow}><Link href={`/products/${product.id}`}><small>{product.brand} · {product.category}</small><strong>{product.name}</strong></Link>{favorite ? <FavoriteButton productId={product.id} initialFavorited isAuthenticated returnTo="/my" small /> : <ChevronRight size={15} />}</li>; }
  return <section id={id} className={styles.section}><div className={styles.sectionHead}><h2>{title} <span className={styles.count}>{count ?? "—"}</span></h2>{href && <Link href={href}>{linkLabel}<ChevronRight size={14} /></Link>}</div>
    {!items ? <p className={styles.empty}>잠시 불러오지 못했어요. <Link href="/my">다시 불러오기</Link></p> : items.length ? <><ul>{items.slice(0, 3).map(row)}</ul>{items.length > 3 && <details className={styles.details}><summary>나머지 {items.length - 3}개 펼쳐보기</summary><ul>{items.slice(3).map(row)}</ul></details>}</> : <p className={styles.empty}>아직 기록이 없어요. <Link href="/">제품 둘러보기</Link></p>}
  </section>;
}
