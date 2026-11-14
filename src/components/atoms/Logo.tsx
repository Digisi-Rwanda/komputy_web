import { cn } from "@/lib/cn";

/** Ledgerline symbol (three offset ledger bars) + wordmark. Replace path data once DS0 is vectorised. */
export function Logo({ wordmark = true, className }: { wordmark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-fg", className)}>
      <svg aria-hidden={wordmark} aria-label={wordmark ? undefined : "Ledgerline"} role={wordmark ? undefined : "img"} viewBox="0 0 24 24" className="size-6 shrink-0" fill="currentColor">
        <rect x="3" y="5" width="13" height="4" rx="2" />
        <rect x="8" y="10" width="13" height="4" rx="2" opacity="0.65" />
        <rect x="3" y="15" width="13" height="4" rx="2" opacity="0.35" />
      </svg>
      {wordmark && <span className="text-h4 font-medium tracking-[-0.03em]">Ledgerline</span>}
    </span>
  );
}
