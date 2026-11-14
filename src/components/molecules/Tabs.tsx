"use client";
import Link from "next/link";
import * as RToggle from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/cn";

export interface TabItem { label: string; href: string; count?: number; disabled?: boolean }

const pill = "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-4 text-small whitespace-nowrap transition-colors duration-fast";
const count = (n?: number) => n != null && <span className="rounded-full bg-neutral-tint px-1.5 text-micro text-fg-body">{n}</span>;

/** Route tabs (each tab is a URL). `variant="underline"` for dense pages. */
export function SegmentedTabs({ items, active, variant = "pill", className, label = "Sections" }: { items: TabItem[]; active: string; variant?: "pill" | "underline"; className?: string; label?: string }) {
  return (
    <nav aria-label={label} className={cn("flex max-w-full overflow-x-auto [scrollbar-width:none]", variant === "pill" ? "w-fit gap-1 rounded-full bg-surface p-1" : "gap-6 border-b border-line", className)}>
      {items.map((t) => {
        const on = t.href === active;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            aria-disabled={t.disabled || undefined}
            className={cn(
              variant === "pill" ? cn(pill, on ? "bg-surface-active text-fg ring-inner" : "text-fg-muted hover:text-fg") : cn("-mb-px inline-flex h-10 shrink-0 items-center gap-1.5 border-b-2 text-small", on ? "border-fg text-fg" : "border-transparent text-fg-muted hover:text-fg"),
              t.disabled && "pointer-events-none opacity-40",
            )}
          >
            {t.label}
            {count(t.count)}
          </Link>
        );
      })}
    </nav>
  );
}

export interface ToggleOption { value: string; label: string; count?: number }

/** In-page segmented switch (no URL change), e.g. Annual | Monthly. */
export function ToggleGroup({ options, value, onChange, label, className }: { options: ToggleOption[]; value: string; onChange: (v: string) => void; label: string; className?: string }) {
  return (
    <RToggle.Root type="single" value={value} onValueChange={(v) => v && onChange(v)} aria-label={label} className={cn("inline-flex w-fit gap-1 rounded-full bg-surface p-1", className)}>
      {options.map((o) => (
        <RToggle.Item key={o.value} value={o.value} className={cn(pill, "text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-focus data-[state=on]:bg-surface-active data-[state=on]:text-fg data-[state=on]:ring-inner")}>
          {o.label}
          {count(o.count)}
        </RToggle.Item>
      ))}
    </RToggle.Root>
  );
}
