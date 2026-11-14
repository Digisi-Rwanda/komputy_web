import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const map = {
  info: ["bg-info-tint border-accent/30", Info, "text-link"],
  warning: ["bg-warning-tint border-warning/30", AlertTriangle, "text-warning"],
  negative: ["bg-negative-tint border-negative/30", XCircle, "text-negative"],
  positive: ["bg-positive-tint border-positive/30", CheckCircle2, "text-positive"],
} as const;

/** Inline/page banner: trial, impersonation, suspended, info. */
export function Banner({ tone = "info", title, children, action, className }: { tone?: keyof typeof map; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  const [box, I, ic] = map[tone];
  return (
    <div role={tone === "negative" ? "alert" : "status"} className={cn("flex flex-wrap items-start gap-3 rounded-card border px-4 py-3 text-small text-fg-body", box, className)}>
      <I aria-hidden className={cn("mt-0.5 size-4 shrink-0", ic)} />
      <div className="min-w-0 flex-1">
        {title && <p className="text-fg">{title}</p>}
        {children}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
