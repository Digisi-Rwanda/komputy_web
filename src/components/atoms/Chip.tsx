import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Static mono chip for metadata: "v1.3.0", "30 Sep 2026", "USD". */
export const MetaChip = ({ children, icon, className }: { children: ReactNode; icon?: ReactNode; className?: string }) => (
  <span className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 font-mono text-micro text-fg-body [&_svg]:size-3.5", className)}>
    {icon}
    {children}
  </span>
);
