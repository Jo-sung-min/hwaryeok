import Link from "next/link";
import { Camera, ChevronRight, Settings, Flame, Heart, MessageSquare, Scale } from "lucide-react";
import { IngredientPreferencesForm } from "./ingredient-preferences-form";
import { MyTabs } from "./my-tabs";
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
  const details = [
    ["수분감", label(profile?.hydrationLevel, { LOW: "부족한 편", BALANCED: "보통", HIGH: "충분한 편" })],
    ["유분감", label(profile?.oilinessLevel, { LOW: "적은 편", BALANCED: "보통", HIGH: "많은 편" })],
    ["민감 반응", label(profile?.sensitivityLevel, { LOW: "드문 편", MEDIUM: "가끔", HIGH: "잦은 편" })],
    ["트러블", label(profile?.breakoutFrequency, { RARE: "드문 편", OCCASIONAL: "가끔", FREQUENT: "잦은 편" })],
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

    <section className={styles.section}>
      <div className={styles.sectionHead}><h2>내 피부 요약</h2><Link href="/skin-check">{profile?.configured ? "다시 체크" : "피부 체크"}<ChevronRight size={14} /></Link></div>
      <div className={styles.skinCard}>
        <div className={styles.sectionHead}><strong className={styles.skinTitle}>{profile === null ? "피부 정보를 불러오지 못했어요" : profile.configured ? `${profile.skinType ?? "등록된 피부"} 경향` : "아직 나의 피부를 모르겠다면"}</strong><span className={styles.badge}>답변 기반</span></div>
        <p className={styles.muted}>{profile?.configured ? "직접 알려주신 피부 상태를 맞춤 순위에 반영해요." : "피부 체크를 완료하고 계정에 저장하면 여기에 정리돼요."}</p>
        {profile?.configured ? <><dl className={styles.metrics}>{details.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><div className={styles.tags}>{profile.concerns.map(concern => <span key={concern}>{concern}</span>)}</div>{profile.updatedAt && <p className={styles.note}>최근 저장 {new Date(profile.updatedAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} · 측정·의료 진단이 아닌 자가 체크예요.</p>}</> : <Link className={styles.primaryLink} href={profile === null ? "/my" : "/skin-check"}>{profile === null ? "다시 불러오기" : "나의 피부 체크 시작"}<ChevronRight size={15} /></Link>}
      </div>
      <Link href="/my/photo-analysis" className={styles.photoLink}><span className={styles.cameraIcon}><Camera size={22} /></span><span><strong>사진으로 피부 살펴보기</strong><small>사진으로 확인하는 피부 표면 관찰 리포트</small></span><ChevronRight size={18} /></Link>
    </section>

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
      <MenuRow href="/skin-check" title="나의 성분찾기" detail="피부 정보 확인·수정" />
      <MenuRow href="/experts/apply" title="전문가 인증" />
      {user.role === "ADMIN" && <MenuRow href="/admin" title="관리자 센터" />}
      <MenuRow href="/privacy" title="개인정보처리방침" />
    </section>
  </div>;
}

function label(value: string | null | undefined, labels: Record<string, string>) { return value ? labels[value] ?? "미등록" : "미등록"; }
function MenuRow({ href, title, detail }: { href: string; title: string; detail?: string }) {
  return <Link href={href} className={styles.menuRow}><span><strong>{title}</strong>{detail && <small>{detail}</small>}</span><ChevronRight size={16} /></Link>;
}
function ProductList({ id, title, items, count, href, linkLabel, favorite = false }: { id: string; title: string; items?: { product: Product }[]; count?: number; href?: string; linkLabel?: string; favorite?: boolean }) {
  function row({ product }: { product: Product }) { return <li key={product.id} className={styles.productRow}><Link href={`/products/${product.id}`}><small>{product.brand} · {product.category}</small><strong>{product.name}</strong></Link>{favorite ? <FavoriteButton productId={product.id} initialFavorited isAuthenticated returnTo="/my" small /> : <ChevronRight size={15} />}</li>; }
  return <section id={id} className={styles.section}><div className={styles.sectionHead}><h2>{title} <span className={styles.count}>{count ?? "—"}</span></h2>{href && <Link href={href}>{linkLabel}<ChevronRight size={14} /></Link>}</div>
    {!items ? <p className={styles.empty}>잠시 불러오지 못했어요. <Link href="/my">다시 불러오기</Link></p> : items.length ? <><ul>{items.slice(0, 3).map(row)}</ul>{items.length > 3 && <details className={styles.details}><summary>나머지 {items.length - 3}개 펼쳐보기</summary><ul>{items.slice(3).map(row)}</ul></details>}</> : <p className={styles.empty}>아직 기록이 없어요. <Link href="/">제품 둘러보기</Link></p>}
  </section>;
}
