import { cn } from "@/lib/cn";

export const Spinner = ({ className, label = "Loading" }: { className?: string; label?: string }) => (
  <span role="status" aria-label={label} className={cn("inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-line-strong border-t-fg", className)} />
);

/** Three blinking dots, for inline "working…" text. */
export const LoadingDots = ({ className }: { className?: string }) => (
  <span role="status" aria-label="Loading" className={cn("inline-flex gap-1", className)}>
    {[0, 1, 2].map((i) => <span key={i} className="size-1 animate-pulse rounded-full bg-current" style={{ animationDelay: `${i * 160}ms` }} />)}
  </span>
);
