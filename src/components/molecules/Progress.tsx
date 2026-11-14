import { cn } from "@/lib/cn";

type Tone = "accent" | "positive" | "warning" | "negative";
const bg: Record<Tone, string> = { accent: "bg-accent", positive: "bg-positive", warning: "bg-warning", negative: "bg-negative" };
const stroke: Record<Tone, string> = { accent: "stroke-accent", positive: "stroke-positive", warning: "stroke-warning", negative: "stroke-negative" };
/** Quota colouring: amber from 80 %, red when full. */
const auto = (pct: number): Tone => (pct >= 100 ? "negative" : pct >= 80 ? "warning" : "accent");

export function ProgressBar({ value, max = 100, label, tone, showValue, className }: { value: number; max?: number; label: string; tone?: Tone; showValue?: boolean; className?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-active">
        <div className={cn("h-full rounded-full transition-[width] duration-slow ease-out", bg[tone ?? auto(pct)])} style={{ width: `${pct}%` }} />
      </div>
      {showValue && <span className="font-mono text-micro text-fg-muted tabular-nums">{value} / {max}</span>}
    </div>
  );
}

/** Ring progress (compute %, MFA coverage). Children render in the centre. */
export function ProgressCircle({ value, max = 100, size = 64, label, tone, children }: { value: number; max?: number; size?: number; label: string; tone?: Tone; children?: React.ReactNode }) {
  const pct = Math.min(100, (value / max) * 100), r = 15.5, c = 2 * Math.PI * r;
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label} className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" className="stroke-surface-active" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" className={cn("transition-[stroke-dashoffset] duration-slow", stroke[tone ?? "accent"])} strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</span>
    </div>
  );
}
