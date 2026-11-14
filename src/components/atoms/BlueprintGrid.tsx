import { cn } from "@/lib/cn";

/** Decorative blueprint grid layer, faded top/bottom. Place inside a relative parent. */
export const BlueprintGrid = ({ className }: { className?: string }) => <div aria-hidden className={cn("bg-blueprint fade-y pointer-events-none absolute inset-0 opacity-70", className)} />;
