"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useTransition, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowRight, Camera, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, SlidersHorizontal } from "lucide-react";
import { HomeProductCard } from "@/components/home-product-card";
import { selectionHaptic } from "@/lib/haptics";
import {
  FACE_MODEL, FACE_VIEWS, FACE_ZONES, faceSymptomImage, faceZoneImage, findFaceSymptom, findFaceView, findFaceZone,
  symptomsForZone, turnFaceView, viewForZone, zonePlacement,
  type FaceBox, type FaceTurn, type FaceViewId, type FaceZoneId,
} from "@/lib/face-concerns";
import { getFaceConcernRecommendations, type FaceConcernResult } from "./actions";
import styles from "./face-concern.module.css";

const RETURN_TO = "/skin-check/face";
const DRAG_START_PX = 8;
const TURN_DISTANCE_PX = 44;
const MAX_TILT_DEG = 22;

const TURN_BUTTONS: Array<{ turn: FaceTurn; icon: typeof ChevronLeft }> = [
  { turn: "left", icon: ChevronLeft },
  { turn: "right", icon: ChevronRight },
  { turn: "up", icon: ChevronUp },
  { turn: "down", icon: ChevronDown },
];
const TURN_KEYS: Record<string, FaceTurn> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };

const percent = (value: number, total: number) => `${(value / total) * 100}%`;
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

function boxStyle(box: FaceBox) {
  return { left: percent(box.x, FACE_MODEL.width), top: percent(box.y, FACE_MODEL.height), width: percent(box.size, FACE_MODEL.width) };
}

/** ㅁ 마커와 확대컷을 잇는 바깥쪽 두 선. 두 사각형이 놓인 대각선 방향에 맞는 모서리끼리 잇는다. */
function connectorLines(marker: FaceBox, callout: FaceBox) {
  const corners = (box: FaceBox) => ({
    topLeft: [box.x, box.y], topRight: [box.x + box.size, box.y],
    bottomLeft: [box.x, box.y + box.size], bottomRight: [box.x + box.size, box.y + box.size],
  });
  const m = corners(marker);
  const c = corners(callout);
  const dx = marker.x + marker.size / 2 - (callout.x + callout.size / 2);
  const dy = marker.y + marker.size / 2 - (callout.y + callout.size / 2);
  return dx * dy >= 0
    ? [[c.topRight, m.topRight], [c.bottomLeft, m.bottomLeft]]
    : [[c.topLeft, m.topLeft], [c.bottomRight, m.bottomRight]];
}

export function FaceConcernFinder({ initialZoneId, initialSymptomId, initialResult, isAuthenticated, favoriteIds }: {
  initialZoneId: FaceZoneId | null;
  initialSymptomId: string | null;
  initialResult: FaceConcernResult | null;
  isAuthenticated: boolean;
  favoriteIds: string[];
}) {
  const [zoneId, setZoneId] = useState<FaceZoneId | null>(initialZoneId);
  const [symptomId, setSymptomId] = useState<string | null>(initialSymptomId);
  const [viewId, setViewId] = useState<FaceViewId>(() => findFaceZone(initialZoneId)?.placements[0].view ?? "front");
  const [result, setResult] = useState<FaceConcernResult | null>(initialResult);
  const [tilt, setTilt] = useState({ x: 0, y: 0, dragging: false });
  const [pending, startTransition] = useTransition();
  const latestRequest = useRef(0);
  const drag = useRef<{ pointerId: number; x: number; y: number; axis: "pending" | "x" | "y" } | null>(null);

  const zone = findFaceZone(zoneId);
  const symptom = findFaceSymptom(symptomId);
  const view = findFaceView(viewId)!;
  const placement = zone ? zonePlacement(zone, viewId) : null;
  const symptoms = symptomsForZone(zoneId);
  const favorites = new Set(favoriteIds);
  const plainLabel = zone?.id === "crown" ? "평소 모습" : "평소 피부";

  function syncAddress(nextZone: FaceZoneId | null, nextSymptom: string | null) {
    const params = new URLSearchParams();
    if (nextSymptom) params.set("symptom", nextSymptom);
    else if (nextZone) params.set("zone", nextZone);
    window.history.replaceState(null, "", params.size ? `?${params}` : window.location.pathname);
  }

  function showView(nextView: FaceViewId) {
    selectionHaptic();
    setViewId(nextView);
  }

  function selectZone(nextZoneId: FaceZoneId | null) {
    const nextZone = findFaceZone(nextZoneId);
    selectionHaptic();
    latestRequest.current += 1;
    setZoneId(nextZoneId);
    setSymptomId(null);
    setResult(null);
    if (nextZone) setViewId(viewForZone(nextZone, viewId));
    syncAddress(nextZoneId, null);
  }

  function selectSymptom(nextSymptomId: string) {
    const next = findFaceSymptom(nextSymptomId);
    const nextZone = findFaceZone(next?.zone);
    if (!next || !nextZone) return;
    selectionHaptic();
    const request = ++latestRequest.current;
    setZoneId(next.zone);
    setSymptomId(next.id);
    setResult(null);
    setViewId(viewForZone(nextZone, viewId));
    syncAddress(next.zone, next.id);
    startTransition(async () => {
      const response = await getFaceConcernRecommendations(next.id).catch(() => null);
      if (latestRequest.current !== request) return;
      setResult(response ?? {
        success: false, message: "추천을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        symptomId: next.id, basis: "concern", personalized: false, products: [], totalProducts: 0, ingredients: [],
      });
    });
  }

  function rotate(turn: FaceTurn) {
    const target = turnFaceView(viewId, turn);
    if (target) showView(target);
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    if ((event.target as HTMLElement).closest("button")) return;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, axis: "pending" };
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (current.axis === "pending") {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_START_PX) return;
      current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      // 터치에서는 세로 움직임을 페이지 스크롤에 양보한다. 위아래는 화살표 버튼으로 돌린다.
      if (current.axis === "y" && event.pointerType !== "mouse") { drag.current = null; return; }
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    setTilt(current.axis === "x"
      ? { x: clamp((dx / bounds.width) * MAX_TILT_DEG * 2, MAX_TILT_DEG), y: 0, dragging: true }
      : { x: 0, y: clamp((-dy / bounds.height) * MAX_TILT_DEG * 2, MAX_TILT_DEG), dragging: true });
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setTilt({ x: 0, y: 0, dragging: false });
    if (cancelled || current.axis === "pending") return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (current.axis === "x" && Math.abs(dx) >= TURN_DISTANCE_PX) rotate(dx > 0 ? "right" : "left");
    if (current.axis === "y" && Math.abs(dy) >= TURN_DISTANCE_PX) rotate(dy < 0 ? "up" : "down");
  }

  function turnWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const turn = TURN_KEYS[event.key];
    if (!turn || event.target !== event.currentTarget) return;
    event.preventDefault();
    rotate(turn);
  }

  const lines = placement ? connectorLines(placement.marker, placement.callout) : [];
  const loading = Boolean(symptom) && (pending || !result);
  const dots = FACE_ZONES.flatMap((item) => {
    const spot = zonePlacement(item, viewId);
    return spot && item.id !== zoneId ? [{ zone: item, marker: spot.marker }] : [];
  });

  return <div className={`container-page ${styles.page}`}>
    <header className={styles.header}>
      <h1>얼굴에서 고민 찾기</h1>
    </header>

    <div className={styles.zones} role="group" aria-label="얼굴 부위">
      <button type="button" className="glass-choice rounded-full" aria-pressed={zoneId === null} onClick={() => selectZone(null)}>전체</button>
      {FACE_ZONES.map((item) => (
        <button key={item.id} type="button" className="glass-choice rounded-full" aria-pressed={zoneId === item.id} onClick={() => selectZone(item.id)}>{item.label}</button>
      ))}
    </div>

    <div className={styles.finder}>
      <div className={styles.faceColumn}>
        <div
          className={styles.face}
          style={{ aspectRatio: `${FACE_MODEL.width} / ${FACE_MODEL.height}` }}
          role="group"
          aria-label={`돌려 볼 수 있는 AI 모델 얼굴, 지금 각도 ${view.label}. 화살표 키로 돌릴 수 있어요.`}
          tabIndex={0}
          data-dragging={tilt.dragging}
          onKeyDown={turnWithKeyboard}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={(event) => endDrag(event)}
          onPointerCancel={(event) => endDrag(event, true)}
          onDragStart={(event) => event.preventDefault()}
        >
          <div className={styles.stage} data-dragging={tilt.dragging} style={{ transform: `perspective(900px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` }}>
            {FACE_VIEWS.map((item) => (
              <Image
                key={item.id}
                src={item.src}
                alt={item.id === viewId ? `AI 모델의 ${item.label} 모습` : ""}
                aria-hidden={item.id === viewId ? undefined : true}
                fill
                priority={item.id === "front"}
                draggable={false}
                sizes="(max-width: 594px) 56vw, 330px"
                className={styles.faceImage}
                data-active={item.id === viewId}
              />
            ))}
            {placement && <svg className={styles.overlay} viewBox={`0 0 ${FACE_MODEL.width} ${FACE_MODEL.height}`} preserveAspectRatio="none" aria-hidden="true">
              {lines.map(([from, to], index) => <g key={index}>
                <line className={styles.lineHalo} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
                <line className={styles.line} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
              </g>)}
              <rect className={styles.markerHalo} x={placement.marker.x} y={placement.marker.y} width={placement.marker.size} height={placement.marker.size} />
              <rect className={styles.marker} x={placement.marker.x} y={placement.marker.y} width={placement.marker.size} height={placement.marker.size} />
            </svg>}
            {zone && placement && <div className={styles.callout} style={boxStyle(placement.callout)}>
              <Image key={symptom?.id ?? zone.id} src={symptom ? faceSymptomImage(symptom.id) : faceZoneImage(zone.id)} alt="" fill draggable={false} sizes="(max-width: 594px) 22vw, 130px" />
              <span>{symptom ? symptom.label : plainLabel}</span>
            </div>}
            {dots.map(({ zone: item, marker }) => (
              <button
                key={item.id}
                type="button"
                className={styles.dot}
                style={{ left: percent(marker.x + marker.size / 2, FACE_MODEL.width), top: percent(marker.y + marker.size / 2, FACE_MODEL.height) }}
                aria-label={`${item.label} 선택`}
                onClick={() => selectZone(item.id)}
              ><span><Plus size={13} strokeWidth={2.6} aria-hidden="true" /></span></button>
            ))}
          </div>
          {TURN_BUTTONS.map(({ turn, icon: Icon }) => {
            const target = findFaceView(turnFaceView(viewId, turn));
            return target && (
              <button key={turn} type="button" className={styles.turn} data-turn={turn} aria-label={`${target.label} 보기`} title={`${target.label} 보기`} onClick={() => rotate(turn)}>
                <Icon size={16} strokeWidth={2.4} aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <div className={styles.viewBar}>
          <span aria-live="polite">{view.label}</span>
          {viewId !== "front" && <button type="button" onClick={() => showView("front")}>정면</button>}
        </div>
      </div>

      <div className={styles.symptoms}>
        <p className={styles.panelTitle}>{zone ? zone.label : "대표 증상"}</p>
        <ul>
          {symptoms.map((item) => (
            <li key={item.id}>
              <button type="button" className={styles.symptom} aria-pressed={symptomId === item.id} onClick={() => selectSymptom(item.id)}>
                <span className={styles.thumb}><Image src={faceSymptomImage(item.id)} alt="" fill sizes="40px" /></span>
                <span className={styles.symptomCopy}>
                  <strong>{item.label}</strong>
                  {!zone && <small>{findFaceZone(item.zone)?.label}</small>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>

    {symptom && zone && <section className={styles.result} aria-live="polite" aria-busy={loading}>
      <div className={styles.resultHead}>
        <p className={styles.resultKicker}>{zone.label}</p>
        <h2>{symptom.label}</h2>
      </div>

      <div className={styles.compare}>
        <figure>
          <div className={styles.cut}><Image src={faceZoneImage(zone.id)} alt={`AI 모델의 평소 ${zone.label} 확대 모습`} fill sizes="(max-width: 594px) 45vw, 270px" /></div>
          <figcaption>{plainLabel}</figcaption>
        </figure>
        <figure data-active="true">
          <div className={styles.cut}>
            <Image key={symptom.id} src={faceSymptomImage(symptom.id)} alt={`${zone.label}에 ${symptom.label}이 나타난 확대 예시`} fill sizes="(max-width: 594px) 45vw, 270px" />
            <span className={styles.aiBadge}>AI 예시</span>
          </div>
          <figcaption>{symptom.label}</figcaption>
        </figure>
      </div>

      <div className={styles.checks}>
        <ul>{symptom.looks.map((look) => <li key={look}>{look}</li>)}</ul>
        <details>
          <summary>관리 팁<ChevronDown size={15} aria-hidden="true" /></summary>
          <p>{symptom.care}</p>
        </details>
      </div>

      {loading ? (
        <div className={styles.skeleton} role="status" aria-label="추천을 불러오는 중"><span /><span /><span /><span /></div>
      ) : result && !result.success ? (
        <p className={styles.error} role="alert">{result.message}</p>
      ) : result && <>
        {result.ingredients.length > 0 && <section className={styles.block} aria-labelledby="face-ingredients-title">
          <div className={styles.blockHead}>
            <h3 id="face-ingredients-title">성분</h3>
            {result.personalized && <span>내 피부 기준</span>}
          </div>
          <div className={styles.ingredients}>
            {result.ingredients.map(({ ingredient, reason }) => (
              <Link key={ingredient.id} href={`/ingredients/${encodeURIComponent(ingredient.id)}`}>
                <h4>{ingredient.name}</h4>
                <p>{reason}</p>
              </Link>
            ))}
          </div>
        </section>}

        <section className={styles.block} aria-labelledby="face-products-title">
          <div className={styles.blockHead}>
            <h3 id="face-products-title">{result.basis === "category" ? symptom.productCategory ?? "제품" : "화장품"}</h3>
            {result.basis === "concern" && result.totalProducts > result.products.length && (
              <Link href={`/products?concern=${encodeURIComponent(symptom.concerns[0])}`}>전체 {result.totalProducts.toLocaleString("ko-KR")}개 <ArrowRight size={14} aria-hidden="true" /></Link>
            )}
          </div>
          {result.message && <p className={styles.notice}>{result.message}</p>}
          {result.products.length > 0 && <div className={styles.products}>
            {result.products.map((product) => (
              <HomeProductCard
                key={product.id}
                product={product}
                favorited={favorites.has(product.id)}
                isAuthenticated={isAuthenticated}
                returnTo={`${RETURN_TO}?symptom=${symptom.id}`}
              />
            ))}
          </div>}
        </section>
      </>}
    </section>}

    <div className={styles.more}>
      <Link href="/skin-check" className="line-btn"><SlidersHorizontal size={17} aria-hidden="true" />피부 문답</Link>
      <Link href="/my/photo-analysis" className="line-btn"><Camera size={17} aria-hidden="true" />사진 분석</Link>
    </div>
    <p className={styles.disclaimer}>화장품 선택을 돕는 안내예요. 증상이 심하면 피부과 상담을 권해요.</p>
  </div>;
}
