import { cn } from "@/lib/cn";

const tones = {
  positive: "bg-positive shadow-[0_0_8px_var(--positive)]",
  warning: "bg-warning shadow-[0_0_8px_var(--warning)]",
  negative: "bg-negative shadow-[0_0_8px_var(--negative)]",
  info: "bg-accent",
  neutral: "bg-fg-muted",
} as const;

/** Small glowing status dot. */
export const LiveDot = ({ tone = "positive", pulse, className }: { tone?: keyof typeof tones; pulse?: boolean; className?: string }) => (
  <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", tones[tone], pulse && "animate-pulse", className)} />
);
