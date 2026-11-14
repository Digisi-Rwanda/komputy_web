"use client";
import * as R from "@radix-ui/react-radio-group";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CardOption { value: string; title: ReactNode; description?: ReactNode; badge?: ReactNode; icon?: ReactNode; disabled?: boolean }

/** Large selectable cards (service, package, lease type). Radio semantics. */
export function CardSelector({ options, value, onChange, columns = 3, label }: { options: CardOption[]; value?: string; onChange: (v: string) => void; columns?: 2 | 3; label: string }) {
  return (
    <R.Root aria-label={label} value={value} onValueChange={onChange} className={cn("grid gap-3", columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
      {options.map((o) => (
        <R.Item
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          className="flex flex-col items-start gap-2 rounded-card border border-line p-5 text-left outline-none transition-colors hover:border-line-strong focus-visible:ring-4 focus-visible:ring-info-tint disabled:opacity-50 data-[state=checked]:border-accent data-[state=checked]:bg-selected"
        >
          <span className="flex w-full items-center gap-2 text-fg">
            {o.icon}
            <span className="flex-1 text-small font-medium">{o.title}</span>
            {o.badge}
          </span>
          {o.description && <span className="text-micro text-fg-muted">{o.description}</span>}
        </R.Item>
      ))}
    </R.Root>
  );
}
