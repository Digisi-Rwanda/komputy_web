import { Lock } from "lucide-react";

/** Product preview drawn with neutral placeholder bars and a lock glyph (AC1). Decorative. */
export function LockedPreview({ url, kind }: { url: string; kind: "leases" | "ecl" | "other" }) {
  return (
    <div aria-hidden className="relative overflow-hidden rounded-panel border border-line">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="size-2 rounded-full bg-surface-active" />)}</span>
        <span className="mx-auto rounded-full bg-surface px-3 py-0.5 font-mono text-[11px] text-fg-muted">{url}</span>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="flex gap-3"><span className="h-3 w-20 rounded bg-surface-active" /><span className="h-3 flex-1 rounded bg-surface" /><span className="h-3 w-14 rounded bg-surface-active" /></div>)}
        </div>
        <svg viewBox="0 0 200 90" className="w-full">
          {kind === "ecl" ? [30, 45, 38, 60, 52, 70].map((h, i) => <rect key={i} x={i * 33 + 4} y={90 - h} width="22" height={h} fill="var(--surface-active)" />) : <polyline points="0,20 40,28 80,35 120,46 160,58 200,70" fill="none" stroke="var(--surface-active)" strokeWidth="3" />}
        </svg>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="ring-inner inline-flex size-14 items-center justify-center rounded-full bg-raised text-fg"><Lock className="size-6" /></span>
      </div>
    </div>
  );
}
