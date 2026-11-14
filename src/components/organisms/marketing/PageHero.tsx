import type { ReactNode } from "react";
import { Breadcrumb, type Crumb } from "@/components/molecules/Breadcrumb";
import { cn } from "@/lib/cn";

/** Top of every public sub-page: breadcrumb, eyebrow, h1, sub, actions, optional right visual, gradient bloom on the grid. */
export function PageHero({ crumbs, eyebrow, title, sub, actions, visual, children, className }: {
  crumbs?: Crumb[]; eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; actions?: ReactNode; visual?: ReactNode; children?: ReactNode; className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      <div className="relative mx-auto max-w-site border-x border-line">
        <div aria-hidden className="bg-blueprint fade-y absolute inset-0 opacity-40" />
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-32 h-[420px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgb(0_114_245/0.28),rgb(110_61_245/0.12),transparent)] blur-2xl" />
        <div className={cn("relative grid gap-10 px-4 pb-16 pt-10 sm:px-8 lg:px-12 lg:pb-20", visual && "lg:grid-cols-[1.05fr_1fr] lg:items-center")}>
          <div className="flex min-w-0 flex-col gap-5">
            {crumbs && <Breadcrumb items={crumbs} />}
            {eyebrow && <div className="flex flex-wrap items-center gap-2">{eyebrow}</div>}
            <h1 className="max-w-3xl text-[38px] font-medium leading-[1.08] tracking-[-0.04em] text-fg sm:text-[48px] lg:text-[56px]">{title}</h1>
            {sub && <p className="max-w-2xl text-body text-fg-muted md:text-body-lg">{sub}</p>}
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
            {children}
          </div>
          {visual && <div className="min-w-0">{visual}</div>}
        </div>
      </div>
    </section>
  );
}
