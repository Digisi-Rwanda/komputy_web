"use client";
import * as R from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props extends Omit<R.CheckboxProps, "children"> {
  label?: ReactNode;
  description?: ReactNode;
}

export function Checkbox({ label, description, className, id, ...rest }: Props) {
  const auto = useId();
  const cid = id ?? auto;
  const box = (
    <R.Root
      id={cid}
      className={cn(
        "peer inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-line-strong bg-surface outline-none transition-colors duration-fast",
        "focus-visible:ring-4 focus-visible:ring-info-tint data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent disabled:opacity-50",
        !label && className,
      )}
      {...rest}
    >
      <R.Indicator className="text-white">{rest.checked === "indeterminate" ? <Minus className="size-3" /> : <Check className="size-3" strokeWidth={3} />}</R.Indicator>
    </R.Root>
  );
  if (!label) return box;
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <span className="mt-0.5 flex">{box}</span>
      <label htmlFor={cid} className="cursor-pointer text-small text-fg-body peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
        {label}
        {description && <span className="block text-micro text-fg-muted">{description}</span>}
      </label>
    </div>
  );
}
