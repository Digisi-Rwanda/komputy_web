"use client";
import * as R from "@radix-ui/react-switch";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Switch({ label, description, className, id, ...rest }: R.SwitchProps & { label?: ReactNode; description?: ReactNode }) {
  const auto = useId();
  const sid = id ?? auto;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <R.Root
        id={sid}
        className="peer relative inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-surface-active outline-none transition-colors duration-fast focus-visible:ring-4 focus-visible:ring-info-tint data-[state=checked]:bg-accent disabled:opacity-50"
        {...rest}
      >
        <R.Thumb className="block size-4 translate-x-1 rounded-full bg-white transition-transform duration-fast data-[state=checked]:translate-x-5" />
      </R.Root>
      {label && (
        <label htmlFor={sid} className="cursor-pointer text-small text-fg-body peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
          {label}
          {description && <span className="block text-micro text-fg-muted">{description}</span>}
        </label>
      )}
    </div>
  );
}
