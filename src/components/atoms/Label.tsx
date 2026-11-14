import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Label({ className, required, children, ...rest }: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("text-small text-fg-body", className)} {...rest}>
      {children}
      {required && <span aria-hidden className="text-negative"> *</span>}
    </label>
  );
}
