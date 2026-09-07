import { Flame } from "lucide-react";

export function ReviewerFirepower({ score, compact = false }: { score: number | null; compact?: boolean }) {
  return <div className={compact ? "w-28 sm:w-36" : "w-full"}>
    <div className="flex items-center justify-between gap-1 text-[#b24768]">
      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-bold"><Flame size={14} /> 리뷰 화력</span>
      <strong className={compact ? "whitespace-nowrap text-sm tabular-nums" : "whitespace-nowrap text-2xl tabular-nums"}>{score === null ? "집계 전" : `${score.toFixed(1)}°`}</strong>
    </div>
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f9e8ee]" {...(score !== null ? { role: "meter", "aria-label": "리뷰 화력", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": score, "aria-valuetext": `${score.toFixed(1)} / 100` } : { "aria-hidden": true })}>
      <div className="h-full rounded-full bg-[#d46586]" style={{ width: `${Math.max(0, Math.min(100, score ?? 0))}%` }} />
    </div>
  </div>;
}
