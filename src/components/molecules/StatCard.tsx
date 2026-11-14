import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Border-only stat card: muted label, big value, meta line, optional dot/action/children (chart, bar). */
export function StatCard({ label, value, meta, dot, action, children, className }: {
  label: ReactNode; value: ReactNode; meta?: ReactNode; dot?: string; action?: ReactNode; children?: ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2 rounded-card border border-line p-5", className)}>
      <div className="flex items-center gap-2 text-small text-fg-muted">
        {dot && <span aria-hidden className={cn("size-2 rounded-full", dot)} />}
        <span className="flex flex-1 items-center gap-2 truncate">{label}</span>
        {action}
      </div>
      <div className="truncate text-h3 font-medium text-fg tabular-nums">{value}</div>
      {meta && <div className="text-micro text-fg-muted">{meta}</div>}
      {children}
    </div>
  );
}

/** Muted label above one big white number, optional delta and sub-line (dashboard hero). */
export function HeroMetric({ label, value, currency, delta, sub, className }: { label: ReactNode; value: ReactNode; currency?: string; delta?: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-small text-fg-muted">{label}</span>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[34px] font-medium leading-tight tracking-[-0.03em] text-fg tabular-nums md:text-h1">
          {currency && <span className="mr-2 text-h4 text-fg-muted md:text-h3">{currency}</span>}
          {value}
        </span>
        {delta}
      </div>
      {sub && <span className="text-small text-fg-muted">{sub}</span>}
    </div>
  );
}

/** Definition list of label/value pairs. */
export function KeyValue({ items, columns = 2, className }: { items: Array<[string, ReactNode]>; columns?: 1 | 2 | 3 | 4; className?: string }) {
  const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <dl className={cn("grid gap-x-8 gap-y-4", cols, className)}>
      {items.map(([k, v]) => (
        <div key={k} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-micro text-fg-muted">{k}</dt>
          <dd className="truncate text-small text-fg tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
