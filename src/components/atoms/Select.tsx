import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { fieldBase } from "@/components/atoms/Input";

/** Native select styled like inputs: free keyboard support and native mobile pickers. */
export function Select({ invalid, className, wrapperClassName, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; wrapperClassName?: string }) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select aria-invalid={invalid || undefined} className={cn(fieldBase, "h-control appearance-none pl-3 pr-9", className)} {...rest}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
    </div>
  );
}
