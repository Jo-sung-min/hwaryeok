import Link from "next/link";
import { Droplets, Flower2, Leaf, ShieldCheck, Sparkles, Users } from "lucide-react";
import { answerLabel, skinQuestions, type SkinAnswers } from "@/lib/skin-check";
import { buildSkinReport, populationShare, type SkinTypeStatistics } from "@/lib/skin-report";
import { buildSkinCareGuide } from "@/lib/skin-care-guide";
import styles from "./skin-report.module.css";

export function SkinReport({ answers, statistics }: { answers: SkinAnswers; statistics: SkinTypeStatistics | null }) {
  const report = buildSkinReport(answers);
  if (!report) return null;
  const { profile, tendency, archetype, axes, details } = report;
  const share = populationShare(statistics, tendency.type);
  const care = buildSkinCareGuide(profile);
  const axisIcons = [Leaf, Droplets, ShieldCheck, Flower2];
  const label = (key: string) => answerLabel(skinQuestions.find(question => question.key === key)!, answers);
  return <article className={styles.report}>
    <div className={styles.hero}>
      <span className={styles.kicker}>HWARYEOK · MY SKIN REPORT</span>
      <div className={styles.emblem} aria-hidden="true"><Flower2 size={42} strokeWidth={1.25} /><span><Droplets size={19} /></span></div>
      <p className={styles.type}>{tendency.type} 경향</p>
      <h2 id="skin-step-title" tabIndex={-1}>{archetype.name}</h2>
      <p className={styles.lead}>{archetype.focus}</p>
      <div className={styles.code} aria-label="나의 피부 경향 코드">{axes.map(axis => <span key={axis.title}><strong>{axis.code}</strong><small>{axis.label}</small></span>)}</div>
    </div>

    <section className={styles.careGuide} aria-labelledby="skin-care-title">
      <div className={styles.sectionTop}><Sparkles size={18} /><h3 id="skin-care-title">내 피부에는 무엇을 먼저 고르면 좋을까요?</h3></div>
      <p className={styles.careSummary}>{care.summary}</p>
      <div className={styles.ingredientCards}>{care.ingredients.map(ingredient => <Link key={ingredient.id} href={`/ingredients/${encodeURIComponent(ingredient.id)}`}><span>{ingredient.role}</span><h4>{ingredient.name}<span aria-hidden="true"> ↗</span></h4><p>{ingredient.reason}</p><small>성분 설명과 랭킹 보기 →</small></Link>)}</div>
      <div className={styles.careTexture}><span>추천 제형</span><strong>{care.texture}</strong><p>{care.application}</p></div>
      <div className={styles.careTexture}><strong>{care.check.title}</strong><p>{care.check.text}</p></div>
    </section>

    <section className={styles.population} aria-labelledby="skin-population-title">
      <div className={styles.sectionTop}><Users size={17} /><h3 id="skin-population-title">나와 같은 {tendency.type} 경향, 얼마나 있을까요?</h3></div>
      {share ? <><p className={styles.percentage}><strong>{share.percentage.toFixed(1)}<span>%</span></strong><span>피부를 체크한 회원 중<br />같은 {tendency.type} 경향이에요</span></p><div className={styles.bar} role="img" aria-label={tendency.type + " 비율 " + share.percentage.toFixed(1) + "%"}><span style={{ width: share.percentage + "%" }} /></div><p className={styles.caption}>프로필을 저장한 화력 회원 {share.total.toLocaleString("ko-KR")}명 중 {share.count.toLocaleString("ko-KR")}명 · {statistics?.calculatedAt.slice(0, 10)} 기준</p></> : <><strong className={styles.collecting}>{statistics?.status === "COLLECTING" ? "같은 피부 친구들을 만나고 있어요" : "같은 피부 비율을 잠시 확인할 수 없어요"}</strong><p>{statistics?.status === "COLLECTING" ? "피부 체크가 더 모이면 같은 유형의 비율도 알려드릴게요." : "나에게 맞춘 성분과 관리 가이드는 아래에서 계속 볼 수 있어요."}</p></>}
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><span>01</span><div><h3>나를 설명하는 네 가지 피부 성향</h3><p>같은 타입이어도 속당김과 반응은 다를 수 있어요.</p></div></div>
      <div className={styles.axes}>{axes.map((axis, index) => { const Icon = axisIcons[index]; return <div className={styles.axis} key={axis.title}><div className={styles.axisTitle}><span><Icon size={17} />{axis.title}</span><b>{axis.code}</b></div><h4>{axis.label}</h4><p>{axis.text}</p></div>; })}</div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><span>02</span><div><h3>내 피부에서 눈여겨볼 특징</h3><p>이마·코와 볼의 차이를 함께 살펴보세요.</p></div></div>
      <dl className={styles.evidence}>{[["이마·코", "oilinessLevel"], ["양쪽 볼", "cheekOiliness"], ["속당김", "hydrationLevel"]].map(([title, key]) => <div key={key}><dt>{title}</dt><dd>{label(key)}</dd></div>)}</dl>
      <p className={styles.bodyText}>{archetype.introduction}</p>
      {tendency.differentZones && <p className={styles.callout}>{answers.oilinessLevel === "HIGH" ? "이마·코" : "양쪽 볼"}의 번들거림을 더 느끼셨군요. 그 부위는 가볍게 바르고, 반대쪽의 당김에 맞춰 보습 양을 조절해 보세요.</p>}
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><span>03</span><div><h3>피부가 보내는 세부 신호</h3><p>세안·붉어짐·모공 고민에 맞춘 관리 포인트예요.</p></div></div>
      <div className={styles.details}>{details.map((detail, index) => <div key={detail.title}><span className={styles.detailLabel}>{label(["cleansingTightness", "rednessFrequency", "poreLevel"][index])}</span><h4>{detail.title}</h4><p>{detail.text}</p></div>)}</div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><span>04</span><div><h3>나에게 맞는 제품 선택 기준</h3><p>피부 경향에 나의 고민과 취향을 더해요.</p></div></div>
      <div className={styles.tags}>{profile.concerns.map(concern => <span key={concern}>{concern}</span>)}</div>
      <p className={styles.bodyText}>{profile.concerns.join(", ")}을 먼저 챙기고 싶으시군요. {care.preference}</p>
      <dl className={styles.preferences}><div><dt>선호 마무리감</dt><dd>{label("texturePreference")}</dd></div><div><dt>평소 관리 단계</dt><dd>{label("routineComplexity")}</dd></div><div><dt>선케어 사용 습관</dt><dd>{label("sunscreenUsage")}</dd></div></dl>
      <p className={styles.bodyText}>{profile.routineComplexity === "MINIMAL" ? "단계를 줄이고 싶다면 세안·보습·선케어를 기본으로 고르세요." : "지금 쓰는 제품과 역할이 겹치지 않는지 살펴보고, 새 제품은 하나씩 추가해 보세요."}</p>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><span>05</span><div><h3>내 일상에 맞춘 사용 팁</h3><p>제품을 고른 뒤에는 이렇게 사용해 보세요.</p></div></div>
      <div className={styles.details}>
        <div><h4>새 제품을 고를 때</h4><p>{profile.reactionTriggers.length && !profile.reactionTriggers.includes("아직 모름") ? "불편했던 경험으로 " + profile.reactionTriggers.join(" · ") + "을 알려주셨어요. 새 제품의 전성분에서 먼저 확인하고, 이전에 편안했던 제품과 비교해 보세요." : "새 제품은 좁은 부위에서 먼저 사용해 보고, 편안하게 쓸 수 있는지 확인한 뒤 루틴에 더해보세요."}</p></div>
        <div><h4>평소 루틴을 더 편하게</h4><p>{profile.routineContexts.includes("메이크업 밀림") ? "메이크업이 밀린다면 기초 제품을 여러 겹 바르기보다 양을 줄이고, 충분히 흡수된 뒤 다음 단계를 사용해 보세요." : profile.routineContexts.includes("이중 세안") ? "이중 세안 후 당김이 느껴진다면 세안 시간과 마찰부터 줄여보세요. 세안 뒤에는 보습을 이어가세요." : "매일 편안했던 기본 제품을 중심으로 사용하세요. 한 번에 여러 제품을 바꾸지 않으면 잘 맞는 제품을 찾기 쉬워요."}</p></div>
        <div><h4>생활환경에 맞춰 보습하기</h4><p>{profile.environments.includes("냉난방 건조") ? "냉난방으로 건조한 실내에서는 평소보다 당기는 부위를 살펴보고 보습을 보완해 보세요." : profile.environments.includes("야외 활동") ? "야외 활동이 잦다면 선케어를 기본 루틴에 넣고, 제품에 안내된 덧바르는 방법도 함께 챙겨보세요." : "계절과 실내 환경에 따라 보습 양을 조절해 보세요. 같은 제품이라도 그날의 당김과 번들거림에 맞춰 바를 수 있어요."}</p></div>
      </div>
    </section>
    <p className={styles.guideLink}>새 제품은 좁은 부위에서 먼저 확인해 주세요. <a href="/principles#skin-guide">리포트·추천 기준 안내 →</a></p>
  </article>;
}
