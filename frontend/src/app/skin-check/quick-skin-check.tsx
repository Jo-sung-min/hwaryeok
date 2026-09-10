"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ClipboardList, Clock3, Droplets, Flower2, Layers, Leaf, LoaderCircle, Pencil, ShieldCheck, Sparkles, SunMedium, Waves, Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProductVisual } from "@/components/product-ui";
import type { SkinTypeStatistics } from "@/lib/skin-report";
import { SkinReport } from "./skin-report";
import { SKIN_CHECK_DRAFT_KEY, answerLabel, canContinue, chooseAnswer, firstMissingAnswer, restoreSkinDraft, safeCheckView, skinQuestions, toQuickProfile, type CheckView, type SkinAnswers } from "@/lib/skin-check";
import { getQuickRecommendations, type QuickRecommendationResult } from "./actions";
import styles from "./quick-skin-check.module.css";

const icons = { drop: Droplets, sun: SunMedium, waves: Waves, shield: ShieldCheck, flower: Flower2, sparkles: Sparkles, clock: Clock3, layers: Layers, leaf: Leaf, wind: Wind };
const total = skinQuestions.length;

function writeView(view: CheckView, replace = false) {
  const url = new URL(window.location.href);
  url.searchParams.set("step", String(view));
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
}

export function QuickSkinCheck({ statistics }: { statistics: SkinTypeStatistics | null }) {
  const [answers, setAnswers] = useState<SkinAnswers>({});
  const [view, setView] = useState<CheckView>(1);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<QuickRecommendationResult | null>(null);
  const answersRef = useRef<SkinAnswers>({});
  const resultRef = useRef<QuickRecommendationResult | null>(null);
  const requestId = useRef(0);
  const questionArea = useRef<HTMLElement>(null);

  useEffect(() => {
    let restored: ReturnType<typeof restoreSkinDraft> = null;
    try { restored = restoreSkinDraft(window.sessionStorage.getItem(SKIN_CHECK_DRAFT_KEY)); }
    catch { setNotice("이 브라우저에서는 임시 보관이 안 돼요. 새로고침하면 답변이 사라질 수 있어요."); }
    const initial = restored?.answers ?? {};
    const initialView = safeCheckView(new URL(window.location.href).searchParams.get("step") ?? restored?.view ?? 1, initial);
    answersRef.current = initial;
    setAnswers(initial);
    setView(initialView);
    writeView(initialView, true);
    setReady(true);
    const onBack = () => {
      requestId.current++;
      setPending(false);
      setEditing(false);
      const requested = new URL(window.location.href).searchParams.get("step");
      const next = requested === "result" && resultRef.current ? "result" : safeCheckView(requested, answersRef.current);
      setView(next);
      if (String(next) !== requested) writeView(next, true);
    };
    window.addEventListener("popstate", onBack);
    return () => { window.removeEventListener("popstate", onBack); requestId.current++; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.sessionStorage.setItem(SKIN_CHECK_DRAFT_KEY, JSON.stringify({ version: 2, updatedAt: Date.now(), answers, view })); }
    catch { setNotice("임시 보관 공간을 사용할 수 없어요. 이 화면에서는 계속 답변할 수 있어요."); }
  }, [answers, view, ready]);

  useEffect(() => {
    questionArea.current?.scrollTo({ top: 0, behavior: "instant" });
    questionArea.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  }, [view, ready]);

  // Restore the readable report from answers, but request fresh product recommendations.
  useEffect(() => {
    if (!ready || view !== "result" || result) return;
    const profile = toQuickProfile(answersRef.current);
    if (!profile) return;
    const id = ++requestId.current;
    setPending(true);
    getQuickRecommendations(profile).catch(() => ({
      success: false, message: "제품 추천을 불러오지 못했어요. 다시 시도해 주세요.", products: [],
    })).then(response => {
      if (id !== requestId.current) return;
      resultRef.current = response;
      setResult(response);
      setPending(false);
    });
    return () => { requestId.current++; };
  }, [ready, view, result]);

  const navigate = (next: CheckView) => {
    requestId.current++;
    setPending(false);
    setView(next);
    writeView(next);
  };
  const updateAnswers = (next: SkinAnswers) => {
    answersRef.current = next;
    setAnswers(next);
    resultRef.current = null;
    setResult(null);
    requestId.current++;
  };
  const editQuestion = (index: number) => { setEditing(true); navigate(index + 1); };
  const calculate = async () => {
    const profile = toQuickProfile(answersRef.current);
    if (!profile) { setEditing(false); navigate(firstMissingAnswer(answersRef.current) + 1); return; }
    const id = ++requestId.current;
    setPending(true);
    let response: QuickRecommendationResult;
    try { response = await getQuickRecommendations(profile); }
    catch { response = { success: false, message: "제품 추천을 불러오지 못했어요. 답변은 유지되니 다시 시도해 주세요.", products: [] }; }
    if (id !== requestId.current) return;
    resultRef.current = response;
    setResult(response);
    setEditing(false);
    navigate("result");
  };
  const question = typeof view === "number" ? skinQuestions[view - 1] : null;
  const missing = firstMissingAnswer(answers);
  const selected = question ? answers[question.key] : undefined;
  const GroupIcon = question ? icons[question.icon] : ClipboardList;

  return <div className={styles.questionnaire}>
    <header className={styles.topbar}>
      <Link href="/" aria-label="피부 체크 나가고 홈으로"><ArrowLeft size={18} aria-hidden="true" /><span>홈으로</span></Link>
      <h1>나의 피부 체크</h1>
      {view === "result" ? <span className={styles.counter}>피부 리포트</span> : <button type="button" className={styles.reviewLink} onClick={() => { setEditing(false); navigate("review"); }} disabled={!ready || pending}><ClipboardList size={15} aria-hidden="true" />답변 보기</button>}
    </header>
    {view !== "result" && <div className={styles.progress} aria-hidden="true">{skinQuestions.map((q, i) => <span key={q.key} data-complete={answers[q.key] !== undefined} data-current={view === i + 1} />)}</div>}
    <section ref={questionArea} className={styles.questionArea} aria-labelledby="skin-step-title">
      {!ready ? <h2 id="skin-step-title" tabIndex={-1}>피부 체크를 준비하고 있어요…</h2> : question ? <div className={styles.step} data-tone={question.tone}>
        <div className={styles.eyebrow}><span><GroupIcon size={15} aria-hidden="true" />{question.group}</span><span className={styles.counter}><strong>{view}</strong> / {total}</span></div>
        <h2 id="skin-step-title" tabIndex={-1}>{question.title}</h2>
        <p className={styles.description}>{question.hint}</p>
        <div className={styles.selectionMeta}><span>{question.multiple ? question.min ? "복수 선택 · 최대 " + question.max + "개" : "복수 선택 · 선택 사항" : "하나를 선택해 주세요"}</span>{question.multiple && <strong aria-live="polite">{Array.isArray(selected) ? selected.length : 0} / {question.max}</strong>}</div>
        <div className={styles.choices + " " + (question.multiple ? styles.multiChoices : styles.singleChoices)} role="group" aria-label={question.title}>
          {question.options.map(option => {
            const active = Array.isArray(selected) ? selected.includes(option.value) : selected === option.value;
            const Icon = icons[option.icon];
            const atLimit = question.multiple && Array.isArray(selected) && selected.length >= (question.max ?? question.options.length) && !active && option.value !== question.exclusive;
            return <button type="button" key={option.value} aria-pressed={active} disabled={Boolean(atLimit)} className={styles.choice} onClick={() => updateAnswers(chooseAnswer(answers, question, option.value))}>
              <span className={styles.optionIcon}><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></span>
              <span className={styles.optionText}><strong>{option.label}</strong><small>{option.description}</small></span>
              <span className={styles.selectionMark} aria-hidden="true">{active && <Check size={13} strokeWidth={3} />}</span>
            </button>;
          })}
        </div>
        <p className={styles.questionNote}><ShieldCheck size={14} aria-hidden="true" />{question.note}</p>
        {view === 1 && <p className={styles.intro}>총 15문항 · 답변은 이 탭에 최대 24시간 임시 보관돼요. 이전 답변은 언제든 바꿀 수 있어요.</p>}
      </div> : view === "review" ? <div className={styles.step}>
        <div className={styles.eyebrow}><span><ClipboardList size={15} />나의 답변 노트</span><span>언제든 수정 가능</span></div>
        <h2 id="skin-step-title" tabIndex={-1}>답변을 한 번 더 살펴볼까요?</h2>
        <p className={styles.description}>수정할 문항을 누르세요. 다른 답변은 그대로 두고 원하는 항목만 바꿀 수 있어요.</p>
        <AnswerReview answers={answers} onEdit={editQuestion} />
      </div> : <div className={styles.step}>
        <div className={styles.eyebrow}><span><Sparkles size={15} />답변 기반 피부 요약</span><button type="button" onClick={() => navigate("review")} className={styles.textButton}><Pencil size={13} />답변 수정</button></div>
        <SkinReport answers={answers} statistics={statistics} />
        <div className={styles.resultHeading} id="skin-report-products"><h3>내 피부 기준 맞춤 제품{result?.products.length ? " " + result.products.length + "개" : ""}</h3><p>내 피부 고민과 선호하는 사용감을 함께 비교해 보세요.</p></div>
        {result?.success && result.products.length > 0 ? <div className={styles.productList}>{result.products.map((product, index) => <Link key={product.id} href={"/products/" + encodeURIComponent(product.id)} className={styles.product}>
          <div className={styles.productImage}><ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={product.brand + " " + product.name} variant="compact" /><span>{index + 1}</span></div>
          <div><small>{product.brand}</small><h3>{product.name}</h3><strong className={styles.productScore}>맞춤 화력 {product.score}</strong><p>{product.matchReasons?.[0] ?? "연결된 성분과 답변을 함께 살펴봤어요."}</p><small>근거 신뢰 · {product.confidenceLevel === "HIGH" ? "높음" : product.confidenceLevel === "MEDIUM" ? "보통" : "자료 보강 중"}</small></div>
        </Link>)}</div> : <div className={styles.emptyResult}><p role={result?.success === false ? "alert" : "status"}>{result?.message ?? "추천을 다시 계산해 주세요."}</p><button type="button" onClick={calculate} disabled={pending} className={styles.textButton}>{pending ? "불러오는 중…" : "제품 추천 다시 불러오기"}</button></div>}
      </div>}
    </section>
    <footer className={styles.footer}>
      {notice && <p role="status" className={styles.validation}>{notice}</p>}
      <div className={styles.actions}>
        {question && typeof view === "number" && view > 1 && <button type="button" className={styles.previous} onClick={() => { setEditing(false); navigate(view - 1); }}><ArrowLeft size={15} />이전</button>}
        {question && typeof view === "number" ? <button type="button" className={styles.next} disabled={!ready || !canContinue(question, answers)} onClick={() => {
          if (question.multiple && answers[question.key] === undefined) updateAnswers({ ...answers, [question.key]: [] });
          navigate(editing || view === total ? "review" : view + 1);
          setEditing(false);
        }}>{editing ? "수정 완료" : view === total ? "답변 확인하기" : "다음"}<ArrowRight size={16} /></button> : view === "review" ? <button type="button" onClick={calculate} disabled={pending || !ready} className={styles.next}>{pending ? <><LoaderCircle size={16} className="animate-spin" />맞춤 제품을 찾고 있어요</> : missing >= 0 ? <>아직 안 고른 문항 이어하기<ArrowRight size={16} /></> : <><Sparkles size={16} />내 피부 요약과 추천 보기</>}</button> : <Link href="/" className={styles.next}>리포트 확인 완료<ArrowRight size={16} /></Link>}
      </div>
      <p className={styles.disclaimer}>피부 상태 자가 체크 · 의료 진단이 아니에요</p>
    </footer>
  </div>;
}

function AnswerReview({ answers, onEdit }: { answers: SkinAnswers; onEdit: (index: number) => void }) {
  return <ol className={styles.reviewList}>{skinQuestions.map((question, index) => <li key={question.key}><button type="button" onClick={() => onEdit(index)} aria-label={(index + 1) + "번 " + question.title + " 수정"}><span className={styles.reviewNumber}>{index + 1}</span><span><small>{question.group}{question.multiple && !question.min ? " · 선택" : ""}</small><strong>{question.title}</strong><em>{answerLabel(question, answers)}</em></span><Pencil size={15} aria-hidden="true" /></button></li>)}</ol>;
}
