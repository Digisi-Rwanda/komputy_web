import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/atoms/Icon";

/** Centred 440px border-only card with optional icon circle, title and sub. */
export function AuthCard({ title, sub, icon, iconTone, children, wide, className }: { title: ReactNode; sub?: ReactNode; icon?: IconName; iconTone?: "positive" | "warning" | "negative"; children?: ReactNode; wide?: boolean; className?: string }) {
  return (
    <section className={cn("ring-inner w-full rounded-panel border border-line bg-canvas/80 p-6 backdrop-blur sm:p-10", wide ? "max-w-[640px]" : "max-w-[440px]", className)}>
      {icon && (
        <span className={cn("mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-line-strong bg-raised", iconTone === "positive" ? "text-positive" : iconTone === "warning" ? "text-warning" : iconTone === "negative" ? "text-negative" : "text-fg")}>
          <Icon name={icon} size={26} />
        </span>
      )}
      <div className={cn("mb-6 flex flex-col gap-1.5", icon && "items-center text-center")}>
        <h1 className="text-h3 tracking-[-0.02em]">{title}</h1>
        {sub && <p className="text-small text-fg-muted">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

/** Left "What you get" panel beside sign-up / verify cards. */
export function WhatYouGet({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full max-w-[860px] flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center">
      <aside className="hidden w-60 shrink-0 flex-col gap-3 pt-10 lg:flex">
        <p className="text-small text-fg">What you get</p>
        {["14-day free trial", "Sample data to try instantly", "No card required", "Add more services later — same login"].map((t) => (
          <p key={t} className="flex items-start gap-2 text-small text-fg-muted"><Icon name="check" className="mt-0.5 text-positive" />{t}</p>
        ))}
      </aside>
      {children}
    </div>
  );
}
