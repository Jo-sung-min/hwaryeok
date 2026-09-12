"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { analyzePhotoAction } from "./actions";
import { PHOTO_CONSENT_VERSION, photoFileError, type SkinPhotoReport, type SkinPhotoStatus } from "@/lib/skin-photo";
import styles from "./skin-photo.module.css";

export function SkinPhotoForm({ initialStatus }: { initialStatus: SkinPhotoStatus | null }) {
  const [status, setStatus] = useState(initialStatus);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [sent, setSent] = useState(false);
  const [report, setReport] = useState<SkinPhotoReport | null>(null);
  const [pending, startTransition] = useTransition();
  const capture = useRef<HTMLInputElement>(null);
  const album = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLElement>(null);
  const selection = useRef(0);
  const locked = pending || preparing;

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => { if (report) reportRef.current?.focus(); }, [report]);
  useEffect(() => () => { selection.current++; }, []);

  function clear() {
    selection.current++;
    setPhoto(null); setPreview(""); setReport(null); setConsent(false); setError(""); setSent(false);
  }
  async function select(file?: File) {
    if (!file) return;
    clear();
    const current = selection.current;
    const invalid = photoFileError(file);
    if (invalid) { setError(invalid); return; }
    setPreparing(true);
    try {
      // Decode locally (including orientation), remove metadata, resize before any upload.
      const bitmap = await createImageBitmap(file);
      try {
        if (bitmap.width < 256 || bitmap.height < 256 || bitmap.width * bitmap.height > 20_000_000) throw new Error("가로·세로 256px 이상, 2천만 화소 이하의 사진을 선택해 주세요.");
        const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("이 브라우저에서 사진을 준비할 수 없어요. 최신 브라우저를 이용해 주세요.");
        context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
        if (!blob) throw new Error("사진을 읽지 못했어요. 다른 JPEG·PNG 사진을 선택해 주세요.");
        if (current === selection.current) setPhoto(new File([blob], "skin-photo.jpg", { type: "image/jpeg" }));
      } finally { bitmap.close(); }
    } catch (cause) {
      if (current === selection.current) setError(cause instanceof Error && cause.message.includes("주세요") ? cause.message : "사진을 읽지 못했어요. JPEG·PNG 형식으로 다시 선택해 주세요.");
    } finally { if (current === selection.current) setPreparing(false); }
  }
  function analyze() {
    if (!photo || !consent || locked || !status?.enabled || status.remaining <= 0) return;
    setReport(null); setError("");
    setSent(true);
    const data = new FormData(); data.set("photo", photo); data.set("consent", PHOTO_CONSENT_VERSION);
    startTransition(async () => {
      try {
        const result = await analyzePhotoAction(data);
        if (result.status) setStatus(result.status);
        if (result.error) setError(result.error);
        if (result.report) setReport(result.report);
      } catch { setError("연결이 끊겼어요. 잠시 후 페이지를 새로고침해 주세요."); }
    });
  }

  return <div className={styles.body}>
    <div className={styles.intro}><span className={styles.tag}>사진 기반 · 참고용</span><h2>오늘의 피부, 사진으로 살펴봐요</h2><p>보이는 피부 표면 특징을 정리해 드려요.<br />피부 타입 확정이나 수분·유분 측정, 의료 진단은 할 수 없어요.</p></div>
    {!status ? <div className={styles.notice} role="status">분석 서비스에 연결하지 못했어요. <Link href="/my/photo-analysis">다시 불러오기</Link></div> : !status.enabled ? <div className={styles.notice} role="status"><strong>사진 분석 서비스를 준비 중이에요</strong><p>준비가 끝나면 이곳에서 분석할 수 있어요. 사진 미리보기와 <Link href="/skin-check">나의 피부 체크</Link>는 지금 이용할 수 있어요.</p></div> : <p className={styles.quota}>오늘 남은 분석 <strong>{status.remaining} / {status.dailyLimit}회</strong><span>매일 자정(한국 시간) 초기화</span></p>}

    <div className={styles.guide}><strong>촬영 전 체크</strong><ul><li>자연광에서 필터·보정 없이 찍어 주세요.</li><li>화장하지 않은 본인의 얼굴만 선명하게 담아 주세요.</li><li>눈·입 주변의 불필요한 배경과 다른 사람은 제외해 주세요.</li></ul><p>JPEG·PNG · 최대 5MB · 256px 이상 · 최대 2천만 화소</p></div>
    <input ref={capture} type="file" accept="image/jpeg,image/png" capture="user" className={styles.hidden} aria-label="카메라로 피부 사진 촬영" disabled={locked} onChange={event => { void select(event.target.files?.[0]); event.target.value = ""; }} />
    <input ref={album} type="file" accept="image/jpeg,image/png" className={styles.hidden} aria-label="앨범에서 피부 사진 선택" disabled={locked} onChange={event => { void select(event.target.files?.[0]); event.target.value = ""; }} />
    {photo && preview ? <div className={styles.preview}>{/* Private blob preview must not pass through the Next image proxy. */}<img src={preview} alt="분석 전 선택한 내 피부 사진" /><button type="button" onClick={clear} disabled={locked}><Trash2 size={15} />사진·결과 지우기</button><p>{sent ? "분석 요청한 사진 · 화력에 저장되지 않아요" : "현재 기기 미리보기 · 아직 전송하지 않았어요"}</p></div> : <div className={styles.placeholder}><Camera size={30} /><strong>{preparing ? "사진을 준비하고 있어요" : "내 피부 사진 한 장"}</strong><span>선택만으로는 사진이 전송되지 않아요.</span></div>}
    <div className={styles.photoButtons}><button type="button" disabled={locked} onClick={() => capture.current?.click()}><Camera size={17} />사진 촬영</button><button type="button" disabled={locked} onClick={() => album.current?.click()}><ImagePlus size={17} />앨범에서 선택</button></div>
    <p className={styles.small}>모바일에서는 카메라가 열릴 수 있어요. PC·일부 브라우저에서는 파일 선택 창이 열립니다.</p>

    <div className={styles.privacy}>
      <label className={styles.consent}><input type="checkbox" checked={consent} disabled={locked || !photo} onChange={event => setConsent(event.target.checked)} /><span>사진 분석을 위한 정보 처리에 동의합니다.</span></label>
      <Link href="/terms">이용약관에서 정보 전송 안내 보기</Link>
    </div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {status?.enabled && status.remaining <= 0 && <p className={styles.notice}>오늘의 분석 횟수를 모두 사용했어요. 내일 다시 이용해 주세요.</p>}
    <button type="button" className={styles.analyze} disabled={locked || !photo || !consent || !status?.enabled || status.remaining <= 0} onClick={analyze}>{pending ? <><LoaderCircle size={18} className="animate-spin" />피부 사진 살펴보는 중…</> : "동의하고 분석하기"}</button>
    <p className={styles.small} role="status" aria-live="polite">{pending ? "약 10~45초 걸릴 수 있어요. 이 화면에서 기다려 주세요." : "분석 요청은 1분 간격으로 가능하며, 분석 실패·재촬영 결과도 이용 횟수에 포함될 수 있어요."}</p>

    {report && <section ref={reportRef} tabIndex={-1} className={styles.report} aria-label="사진 피부 관찰 리포트"><span className={styles.tag}>사진 관찰 · {new Date(report.analyzedAt).toLocaleDateString("ko-KR")}</span><h2>{report.quality === "USABLE" ? "사진에서 이렇게 보였어요" : "다른 사진으로 다시 살펴봐요"}</h2><p className={styles.summary}>{report.summary}</p>
      {report.quality === "USABLE" && <><div className={styles.observations}>{report.observations.map((item, index) => <article key={index}><h3>{item.area}</h3><p>{item.appearance}</p><small>{item.caveat}</small></article>)}</div>{report.careTips.length > 0 && <div className={styles.guide}><strong>일상에서 참고할 관리 습관</strong><ul>{report.careTips.map((tip, index) => <li key={index}>{tip}</li>)}</ul></div>}</>}
      <p className={styles.disclaimer}>{report.limitations}</p><p className={styles.disclaimer}>사진 관찰 결과는 틀릴 수 있으며, 피부 타입·질환 진단이나 실제 수분·유분 측정이 아닙니다. 불편함이 지속되거나 악화되면 전문가와 상담해 주세요. 저장된 피부 정보와 제품 랭킹은 자동으로 변경하지 않아요.</p><Link className={styles.checkLink} href="/skin-check">답변으로 내 피부 상태 함께 체크하기 →</Link>
    </section>}
  </div>;
}
