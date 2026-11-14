import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const toneVariants = cva("", {
  variants: {
    tone: {
      neutral: "bg-neutral-tint text-fg-muted",
      positive: "bg-positive-tint text-positive",
      warning: "bg-warning-tint text-warning",
      negative: "bg-negative-tint text-negative",
      info: "bg-info-tint text-link",
      inverse: "bg-fg text-fg-inverse",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type Tone = NonNullable<VariantProps<typeof toneVariants>["tone"]>;

/** Small pill for counts and labels: "Trial", "Soon", "NEW", "12". */
export function Badge({ tone, mono, children, className }: { tone?: Tone; mono?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 shrink-0 items-center rounded-full px-2 text-micro font-medium", mono && "font-mono text-label uppercase tracking-[0.04em]", toneVariants({ tone }), className)}>
      {children}
    </span>
  );
}
