import { cn } from "@/lib/cn";
import { CopyButton } from "@/components/atoms/CopyButton";

/** Mono identifier (RUN-0142, LSE-0087, hashes) with optional copy. */
export function MonoId({ children, copy, className }: { children: string; copy?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-micro text-fg-body", className)}>
      {children}
      {copy && <CopyButton value={children} label={`Copy ${children}`} />}
    </span>
  );
}
