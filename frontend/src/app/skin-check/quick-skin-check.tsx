"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ClipboardList, Clock3, Droplets, Flower2, Layers, Leaf, LoaderCircle, Pencil, Save, ShieldCheck, Sparkles, SunMedium, Waves, Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProductVisual } from "@/components/product-ui";
import type { SkinProfile } from "@/lib/api";
import type { SkinTypeStatistics } from "@/lib/skin-report";
import type { Ingredient } from "@/lib/types";
import { SkinReport } from "./skin-report";
import { SKIN_CHECK_DRAFT_KEY, answerLabel, canContinue, chooseAnswer, firstMissingAnswer, resolveSkinDraftAnswers, resolveSkinDraftIngredients, restoreSkinDraft, safeCheckView, skinAnswersFromProfile, skinQuestions, toQuickProfile, type CheckView, type RestoredSkinDraft, type SkinAnswers } from "@/lib/skin-check";
import { getQuickRecommendations, saveSkinCheckProfile, type QuickRecommendationResult, type SkinCheckSaveResult } from "./actions";
import styles from "./quick-skin-check.module.css";

const icons = { drop: Droplets, sun: SunMedium, waves: Waves, shield: ShieldCheck, flower: Flower2, sparkles: Sparkles, clock: Clock3, layers: Layers, leaf: Leaf, wind: Wind };
const total = skinQuestions.length;

function writeView(view: CheckView, replace = false) {
  const url = new URL(window.location.href);
  url.searchParams.set("step", String(view));
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
}

type QuickSkinCheckProps = {
  statistics: SkinTypeStatistics | null;
  initialProfile: SkinProfile | null;
  initialProfileAvailable: boolean;
  ingredients: Ingredient[];
  initialPreferredIngredientIds: string[] | null;
  isAuthenticated: boolean;
  draftOwnerId: string | null;
};

export function QuickSkinCheck({ statistics, initialProfile, initialProfileAvailable, ingredients, initialPreferredIngredientIds, isAuthenticated, draftOwnerId }: QuickSkinCheckProps) {
  const [answers, setAnswers] = useState<SkinAnswers>({});
  const [answersDirty, setAnswersDirty] = useState(false);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState(initialPreferredIngredientIds ?? []);
  const [preferenceSelectionDirty, setPreferenceSelectionDirty] = useState(false);
  const [view, setView] = useState<CheckView>(1);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveState, setSaveState] = useState<SkinCheckSaveResult | null>(null);
  const [result, setResult] = useState<QuickRecommendationResult | null>(null);
  const answersRef = useRef<SkinAnswers>({});
  const resultRef = useRef<QuickRecommendationResult | null>(null);
  const retainedPreferenceDraft = useRef<RestoredSkinDraft | null>(null);
  const profileBaseKnown = useRef(initialProfileAvailable);
  const profileBaseUpdatedAt = useRef(initialProfile?.updatedAt ?? null);
  const preferenceBaseIds = useRef<string[] | null>(initialPreferredIngredientIds);
  const requestId = useRef(0);
  const questionArea = useRef<HTMLElement>(null);

  useEffect(() => {
    let restored: ReturnType<typeof restoreSkinDraft> = null;
    try { restored = restoreSkinDraft(window.sessionStorage.getItem(SKIN_CHECK_DRAFT_KEY)); }
    catch { setNotice("이 브라우저에서는 임시 보관이 안 돼요. 새로고침하면 답변이 사라질 수 있어요."); }
    if (restored && restored.draftOwnerId !== null && restored.draftOwnerId !== draftOwnerId) {
      restored = null;
      try { window.sessionStorage.removeItem(SKIN_CHECK_DRAFT_KEY); } catch { /* 현재 계정과 다른 임시 답변은 사용하지 않아요. */ }
    }
    const answerResolution = resolveSkinDraftAnswers(
      skinAnswersFromProfile(initialProfile),
      restored,
      draftOwnerId,
      initialProfile?.updatedAt ?? null,
      initialProfileAvailable,
    );
    const ingredientResolution = resolveSkinDraftIngredients(
      initialPreferredIngredientIds,
      restored,
      draftOwnerId,
    );
    const initial = answerResolution.answers;
    const guestAnswerHandoff = Boolean(restored && restored.draftOwnerId === null && draftOwnerId !== null && answerResolution.ownerCompatible);
    retainedPreferenceDraft.current = initialPreferredIngredientIds === null && ingredientResolution.ownerCompatible ? restored : null;
    profileBaseKnown.current = initialProfileAvailable || Boolean(
      answerResolution.ownerCompatible && !guestAnswerHandoff && restored?.profileBaseKnown,
    );
    profileBaseUpdatedAt.current = initialProfileAvailable
      ? initialProfile?.updatedAt ?? null
      : answerResolution.ownerCompatible ? restored?.profileBaseUpdatedAt ?? null : null;
    preferenceBaseIds.current = initialPreferredIngredientIds !== null
      ? initialPreferredIngredientIds
      : ingredientResolution.ownerCompatible ? restored?.preferenceBaseIds ?? null : null;
    const firstMissing = firstMissingAnswer(initial);
    const requestedView = new URL(window.location.href).searchParams.get("step")
      ?? (answerResolution.dirty ? restored?.view : null)
      ?? (firstMissing === -1 ? "result" : firstMissing + 1);
    const initialView = safeCheckView(requestedView, initial);
    answersRef.current = initial;
    setAnswers(initial);
    setAnswersDirty(answerResolution.dirty);
    setSelectedIngredientIds(ingredientResolution.ids);
    setPreferenceSelectionDirty(ingredientResolution.dirty);
    if (ingredientResolution.overflowed) setNotice("로그인 전에 고른 성분 일부는 최대 10개 제한으로 제외했어요. 기존 저장 성분은 그대로 유지했어요.");
    else if (!initialProfileAvailable) setNotice("기존 피부 설정을 잠시 불러오지 못했어요. 작성 중이던 답변은 안전하게 유지했어요.");
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
  }, [draftOwnerId, initialPreferredIngredientIds, initialProfile, initialProfileAvailable]);

  useEffect(() => {
    if (!ready) return;
    const retained = initialPreferredIngredientIds === null ? retainedPreferenceDraft.current : null;
    try { window.sessionStorage.setItem(SKIN_CHECK_DRAFT_KEY, JSON.stringify({
      version: 3,
      updatedAt: Date.now(),
      answers,
      answersDirty,
      draftOwnerId,
      profileBaseKnown: profileBaseKnown.current,
      profileBaseUpdatedAt: profileBaseUpdatedAt.current,
      preferenceBaseIds: retained?.preferenceBaseIds ?? preferenceBaseIds.current,
      preferenceOwnerId: retained?.preferenceOwnerId ?? draftOwnerId,
      preferenceSelectionDirty: retained?.preferenceSelectionDirty ?? preferenceSelectionDirty,
      preferredIngredientIds: retained?.preferredIngredientIds ?? (initialPreferredIngredientIds === null ? null : selectedIngredientIds),
      view,
    })); }
    catch { setNotice("임시 보관 공간을 사용할 수 없어요. 이 화면에서는 계속 답변할 수 있어요."); }
  }, [answers, answersDirty, draftOwnerId, initialPreferredIngredientIds, preferenceSelectionDirty, ready, selectedIngredientIds, view]);

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
    getQuickRecommendations(profile, selectedIngredientIds).catch(() => ({
      success: false, message: "맞춤 추천을 불러오지 못했어요. 다시 시도해 주세요.", products: [], ingredients: [],
    })).then(response => {
      if (id !== requestId.current) return;
      resultRef.current = response;
      setResult(response);
      setPending(false);
    });
    return () => { requestId.current++; };
  }, [ready, selectedIngredientIds, view, result]);

  const navigate = (next: CheckView) => {
    requestId.current++;
    setPending(false);
    setView(next);
    writeView(next);
  };
  const updateAnswers = (next: SkinAnswers) => {
    answersRef.current = next;
    setAnswers(next);
    setAnswersDirty(true);
    resultRef.current = null;
    setResult(null);
    setSaveState(null);
    requestId.current++;
  };
  const updateIngredientSelection = (ingredientId: string) => {
    setSelectedIngredientIds((current) => current.includes(ingredientId)
      ? current.filter((id) => id !== ingredientId)
      : current.length < 10 ? [...current, ingredientId] : current);
    setPreferenceSelectionDirty(true);
    resultRef.current = null;
    setResult(null);
    setSaveState(null);
    requestId.current++;
  };
  const editQuestion = (index: number) => { setEditing(true); navigate(index + 1); };
  const calculate = async () => {
    const profile = toQuickProfile(answersRef.current);
    if (!profile) { setEditing(false); navigate(firstMissingAnswer(answersRef.current) + 1); return; }
    const id = ++requestId.current;
    setPending(true);
    let response: QuickRecommendationResult;
    try { response = await getQuickRecommendations(profile, selectedIngredientIds); }
    catch { response = { success: false, message: "맞춤 추천을 불러오지 못했어요. 답변은 유지되니 다시 시도해 주세요.", products: [], ingredients: [] }; }
    if (id !== requestId.current) return;
    resultRef.current = response;
    setResult(response);
    setEditing(false);
    navigate("result");
  };
  const saveProfile = async () => {
    const profile = toQuickProfile(answersRef.current);
    if (!profile || !isAuthenticated) return;
    setSaving(true);
    const response: SkinCheckSaveResult = await saveSkinCheckProfile(profile, initialPreferredIngredientIds === null ? null : selectedIngredientIds).catch(() => ({
      success: false,
      message: "결과를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
    }));
    setSaveState(response);
    setSaving(false);
    if (response.success) {
      profileBaseKnown.current = true;
      profileBaseUpdatedAt.current = response.profileUpdatedAt ?? null;
      setAnswersDirty(false);
      if (response.preferredIngredientIds !== null && response.preferredIngredientIds !== undefined) {
        preferenceBaseIds.current = response.preferredIngredientIds;
        retainedPreferenceDraft.current = null;
        setSelectedIngredientIds(response.preferredIngredientIds);
        setPreferenceSelectionDirty(false);
      }
      try {
        const retained = response.preferredIngredientIds === null ? retainedPreferenceDraft.current : null;
        if (retained) {
          window.sessionStorage.setItem(SKIN_CHECK_DRAFT_KEY, JSON.stringify({
            version: 3,
            updatedAt: Date.now(),
            answers,
            answersDirty: false,
            draftOwnerId,
            profileBaseKnown: profileBaseKnown.current,
            profileBaseUpdatedAt: profileBaseUpdatedAt.current,
            preferenceBaseIds: retained.preferenceBaseIds,
            preferenceOwnerId: retained.preferenceOwnerId,
            preferenceSelectionDirty: retained.preferenceSelectionDirty,
            preferredIngredientIds: retained.preferredIngredientIds,
            view,
          }));
        } else {
          window.sessionStorage.removeItem(SKIN_CHECK_DRAFT_KEY);
        }
      } catch { /* 저장한 영역은 계정에서 다시 불러올 수 있어요. */ }
    }
  };
  const question = typeof view === "number" ? skinQuestions[view - 1] : null;
  const missing = firstMissingAnswer(answers);
  const selected = question ? answers[question.key] : undefined;
  const GroupIcon = question ? icons[question.icon] : ClipboardList;

  return <div className={styles.questionnaire}>
    <header className={styles.topbar}>
      <Link href="/" aria-label="나의 성분찾기 나가고 홈으로"><ArrowLeft size={18} aria-hidden="true" /><span>홈으로</span></Link>
      <h1>나의 성분찾기</h1>
      {view === "result" ? <span className={styles.counter}>피부·성분 결과</span> : <button type="button" className={styles.reviewLink} onClick={() => { setEditing(false); navigate("review"); }} disabled={!ready || pending}><ClipboardList size={15} aria-hidden="true" />답변 보기</button>}
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
        {view === 1 && <p className={styles.intro}>총 {total}문항 · 답변은 이 탭에 최대 24시간 임시 보관돼요. 이전 답변은 언제든 바꿀 수 있어요.</p>}
      </div> : view === "review" ? <div className={styles.step}>
        <div className={styles.eyebrow}><span><ClipboardList size={15} />나의 답변 노트</span><span>언제든 수정 가능</span></div>
        <h2 id="skin-step-title" tabIndex={-1}>답변을 한 번 더 살펴볼까요?</h2>
        <p className={styles.description}>수정할 문항을 누르세요. 기존에 저장한 피부 정보도 이어받아 원하는 항목만 바꿀 수 있어요.</p>
        <AnswerReview answers={answers} onEdit={editQuestion} />
        <IngredientPicker ingredients={ingredients} selectedIds={selectedIngredientIds} onToggle={updateIngredientSelection} available={!isAuthenticated || initialPreferredIngredientIds !== null} />
      </div> : <div className={styles.step}>
        <div className={styles.eyebrow}><span><Sparkles size={15} />피부·성분 통합 결과</span><button type="button" onClick={() => navigate("review")} className={styles.textButton}><Pencil size={13} />답변 수정</button></div>
        <SkinReport answers={answers} statistics={statistics} ingredientRecommendations={result?.ingredients ?? []} />
        <section className={styles.saveCard} aria-labelledby="skin-result-save-title">
          <div><h3 id="skin-result-save-title">이 기준을 다음 추천에도 사용할까요?</h3><p>{initialPreferredIngredientIds === null ? "피부 답변은 저장하고, 지금 불러오지 못한 기존 성분 선택은 그대로 유지해요." : "피부 타입 답변과 잘 맞았던 성분을 한 번에 저장해 제품·성분 추천에 함께 반영해요."}</p></div>
          {isAuthenticated
            ? <button type="button" className={styles.saveButton} onClick={saveProfile} disabled={saving}><Save size={15} />{saving ? "저장하는 중…" : "피부·성분 기준 저장"}</button>
            : <Link className={styles.saveButton} href="/login?returnTo=%2Fskin-check%3Fstep%3Dresult">로그인하고 결과 저장</Link>}
          {saveState && <p className={saveState.success ? styles.saveSuccess : styles.validation} role="status">{saveState.message}</p>}
        </section>
        <section className={styles.productResults} id="skin-report-products" aria-labelledby="skin-report-products-title">
          <div className={styles.resultHeading}><h3 id="skin-report-products-title">내 피부 기준 맞춤 제품{result?.products.length ? " " + result.products.length + "개" : ""}</h3><p>내 피부 고민과 선호하는 사용감을 함께 비교해 보세요.</p></div>
          {result?.success && result.products.length > 0 ? <div className={styles.productList}>{result.products.map((product, index) => <Link key={product.id} href={"/products/" + encodeURIComponent(product.id)} className={styles.product}>
            <div className={styles.productImage}><ProductVisual tone={product.tone} imageUrl={product.imageUrl} alt={product.brand + " " + product.name} variant="compact" /><span>{index + 1}</span></div>
            <div><small>{product.brand}</small><h3>{product.name}</h3><strong className={styles.productScore}>맞춤 화력 {product.score}</strong><p>{product.matchReasons?.[0] ?? "연결된 성분과 답변을 함께 살펴봤어요."}</p><small>근거 신뢰 · {product.confidenceLevel === "HIGH" ? "높음" : product.confidenceLevel === "MEDIUM" ? "보통" : "자료 보강 중"}</small></div>
          </Link>)}</div> : <div className={styles.emptyResult}><p role={result?.success === false ? "alert" : "status"}>{result?.message ?? "추천을 다시 계산해 주세요."}</p><button type="button" onClick={calculate} disabled={pending} className={styles.textButton}>{pending ? "불러오는 중…" : "제품 추천 다시 불러오기"}</button></div>}
        </section>
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
        }}>{editing ? "수정 완료" : view === total ? "답변 확인하기" : "다음"}<ArrowRight size={16} /></button> : view === "review" ? <button type="button" onClick={calculate} disabled={pending || !ready} className={styles.next}>{pending ? <><LoaderCircle size={16} className="animate-spin" />피부와 성분을 함께 찾고 있어요</> : missing >= 0 ? <>아직 안 고른 문항 이어하기<ArrowRight size={16} /></> : <><Sparkles size={16} />내 피부 타입과 성분 보기</>}</button> : <Link href="/" className={styles.next}>결과 확인 완료<ArrowRight size={16} /></Link>}
      </div>
      <p className={styles.disclaimer}>피부 상태 자가 체크와 성분 탐색 · 의료 진단이 아니에요</p>
    </footer>
  </div>;
}

function AnswerReview({ answers, onEdit }: { answers: SkinAnswers; onEdit: (index: number) => void }) {
  return <ol className={styles.reviewList}>{skinQuestions.map((question, index) => <li key={question.key}><button type="button" onClick={() => onEdit(index)} aria-label={(index + 1) + "번 " + question.title + " 수정"}><span className={styles.reviewNumber}>{index + 1}</span><span><small>{question.group}{question.multiple && !question.min ? " · 선택" : ""}</small><strong>{question.title}</strong><em>{answerLabel(question, answers)}</em></span><Pencil size={15} aria-hidden="true" /></button></li>)}</ol>;
}

function IngredientPicker({ ingredients, selectedIds, onToggle, available }: { ingredients: Ingredient[]; selectedIds: string[]; onToggle: (id: string) => void; available: boolean }) {
  const visibleIds = new Set(ingredients.map((ingredient) => ingredient.id));
  const hiddenSelectedCount = selectedIds.filter((id) => !visibleIds.has(id)).length;
  return <section className={styles.ingredientPicker} aria-labelledby="ingredient-experience-title">
    <div className={styles.ingredientPickerHeader}>
      <div><span>선택 사항</span><h3 id="ingredient-experience-title">이미 잘 맞았던 성분이 있나요?</h3><p>사용 경험을 피부 답변과 함께 추천에 반영해요. 최대 10개까지 고를 수 있어요.</p></div>
      <strong aria-live="polite">{selectedIds.length} / 10</strong>
    </div>
    {!available
      ? <p className={styles.ingredientEmpty}>기존 성분 선택을 잠시 불러오지 못했어요. {selectedIds.length > 0 && `작성 중인 선택 ${selectedIds.length}개는 유지했어요. `}성분 선택은 건드리지 않고 피부 답변만 안전하게 저장할 수 있어요. <Link href="/skin-check">다시 불러오기</Link></p>
      : ingredients.length > 0
      ? <>
          <div className={styles.ingredientChoices}>{ingredients.map((ingredient) => {
            const selected = selectedIds.includes(ingredient.id);
            return <button key={ingredient.id} type="button" aria-pressed={selected} onClick={() => onToggle(ingredient.id)} disabled={!selected && selectedIds.length >= 10}>
              <span>{selected && <Check size={13} aria-hidden="true" />}{ingredient.name}</span>
              <small>{ingredient.role}</small>
            </button>;
          })}</div>
          {hiddenSelectedCount > 0 && <p className={styles.ingredientEmpty}>목록을 갱신하는 동안 보이지 않는 선택 {hiddenSelectedCount}개도 그대로 유지해 추천에 반영해요.</p>}
        </>
      : <p className={styles.ingredientEmpty}>성분 목록을 잠시 불러오지 못했어요. {selectedIds.length > 0 ? `기존 선택 ${selectedIds.length}개는 유지해 추천에 반영해요.` : "피부 답변만으로도 결과를 볼 수 있어요."}</p>}
  </section>;
}
