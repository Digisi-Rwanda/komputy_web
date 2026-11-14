import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const fieldBase =
  "w-full rounded-input border border-line bg-surface text-small text-fg placeholder:text-fg-subtle transition-colors duration-fast outline-none hover:border-line-strong focus-visible:border-focus focus-visible:ring-4 focus-visible:ring-info-tint focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-negative aria-invalid:focus-visible:ring-negative-tint";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Right-aligned tabular figures for amounts */
  numeric?: boolean;
  wrapperClassName?: string;
}

export function Input({ invalid, leading, trailing, numeric, className, wrapperClassName, ...rest }: InputProps) {
  return (
    <div className={cn("relative flex items-center", wrapperClassName)}>
      {leading && <span className="pointer-events-none absolute left-3 flex text-fg-muted [&_svg]:size-4">{leading}</span>}
      <input
        aria-invalid={invalid || undefined}
        className={cn(fieldBase, "h-control px-3", leading && "pl-9", trailing && "pr-10", numeric && "text-right font-mono tabular-nums", className)}
        {...rest}
      />
      {trailing && <span className="absolute right-3 flex text-micro text-fg-muted [&_svg]:size-4">{trailing}</span>}
    </div>
  );
}
