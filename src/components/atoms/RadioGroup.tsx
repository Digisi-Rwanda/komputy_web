"use client";
import * as R from "@radix-ui/react-radio-group";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface RadioOption { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean }

export function RadioGroup({ options, className, ...rest }: R.RadioGroupProps & { options: RadioOption[] }) {
  return (
    <R.Root className={cn("flex flex-col gap-3", className)} {...rest}>
      {options.map((o) => {
        const id = `${rest.name ?? "radio"}-${o.value}`;
        return (
          <div key={o.value} className="flex items-start gap-2.5">
            <R.Item
              id={id}
              value={o.value}
              disabled={o.disabled}
              className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface outline-none focus-visible:ring-4 focus-visible:ring-info-tint data-[state=checked]:border-accent disabled:opacity-50"
            >
              <R.Indicator className="size-2 rounded-full bg-accent" />
            </R.Item>
            <label htmlFor={id} className={cn("cursor-pointer text-small text-fg-body", o.disabled && "cursor-not-allowed opacity-50")}>
              {o.label}
              {o.description && <span className="block text-micro text-fg-muted">{o.description}</span>}
            </label>
          </div>
        );
      })}
    </R.Root>
  );
}
