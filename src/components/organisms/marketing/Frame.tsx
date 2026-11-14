import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Monitor-style section frame: 1180px column with vertical hairlines down the page and a rule on top. */
export function Frame({ children, id, className, inner, label }: { children: ReactNode; id?: string; className?: string; inner?: string; label?: string }) {
  return (
    <section id={id} aria-label={label} className={cn("border-t border-line", className)}>
      <div className={cn("relative mx-auto max-w-site border-x border-line px-4 py-20 sm:px-8 lg:px-12 lg:py-28", inner)}>{children}</div>
    </section>
  );
}

/** Pill label + h2 + optional sub. */
export function SectionHeading({ label, title, sub, align = "left", className }: { label?: string; title: ReactNode; sub?: ReactNode; align?: "left" | "center"; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", align === "center" && "items-center text-center", className)}>
      {label && <span className="ring-inner inline-flex h-7 w-fit items-center rounded-full bg-surface px-3 text-micro text-fg-body">{label}</span>}
      <h2 className="max-w-3xl text-[32px] leading-[1.15] tracking-[-0.03em] md:text-h1">{title}</h2>
      {sub && <p className="max-w-2xl text-body-lg text-fg-muted">{sub}</p>}
    </div>
  );
}

/** Tick list used across sections. */
export function Ticks({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-small text-fg-body">
          <svg aria-hidden viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0 text-positive"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {t}
        </li>
      ))}
    </ul>
  );
}
