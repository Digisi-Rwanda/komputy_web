import { cn } from "@/lib/cn";

/** Blur + fade overlay at the bottom (or top) of a scrolling list. Place inside a relative parent. */
export function ProgressiveBlur({ side = "bottom", className }: { side?: "top" | "bottom"; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 h-16 backdrop-blur-[2px]", side === "bottom" ? "bottom-0" : "top-0", className)}
      style={{
        background: `linear-gradient(${side === "bottom" ? "to bottom" : "to top"}, transparent, var(--canvas))`,
        maskImage: `linear-gradient(${side === "bottom" ? "to bottom" : "to top"}, transparent, black)`,
      }}
    />
  );
}
