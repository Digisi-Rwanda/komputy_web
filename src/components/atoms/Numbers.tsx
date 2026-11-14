import { cn } from "@/lib/cn";
import { money, percent, delta, pd } from "@/lib/format";

/** Amount: tabular; negatives in parentheses, red when `signed`. */
export function Money({ value, currency, signed, decimals = 2, className }: { value: number; currency?: string; signed?: boolean; decimals?: number; className?: string }) {
  return (
    <span className={cn("tabular-nums", signed && value < 0 && "text-negative", className)}>
      {currency && <span className="text-fg-muted">{currency} </span>}
      {money(value, decimals)}
    </span>
  );
}

export const Percent = ({ value, decimals = 2, className }: { value: number; decimals?: number; className?: string }) => <span className={cn("tabular-nums", className)}>{percent(value, decimals)}</span>;

export const PD = ({ value, className }: { value: number; className?: string }) => <span className={cn("font-mono tabular-nums", className)}>{pd(value)}</span>;

/** "▲ +4.2 % vs Aug". For provisions more is worse, so up is amber unless goodWhenUp. */
export function Delta({ value, suffix, goodWhenUp = false, className }: { value: number; suffix?: string; goodWhenUp?: boolean; className?: string }) {
  const good = value >= 0 === goodWhenUp;
  return (
    <span className={cn("inline-flex items-center gap-1 text-micro tabular-nums", value === 0 ? "text-fg-muted" : good ? "text-positive" : "text-warning", className)}>
      <span aria-hidden>{value > 0 ? "▲" : value < 0 ? "▼" : "•"}</span>
      {delta(value)}
      {suffix && <span className="text-fg-muted">{suffix}</span>}
    </span>
  );
}
