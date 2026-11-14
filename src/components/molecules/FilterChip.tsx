import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  /** applied value; empty renders the dashed "⊕ Filter" chip */
  value?: string;
  onClear?: () => void;
}

/** Dashed add-filter chip, or applied chip "Segment: Retail ×". forwardRef so it can be a popover trigger. */
export const FilterChip = forwardRef<HTMLButtonElement, Props>(function FilterChip({ label, value, onClear, className, ...rest }, ref) {
  if (!value) {
    return (
      <button ref={ref} type="button" className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3 text-micro text-fg-muted transition-colors hover:border-fg-muted hover:text-fg data-[state=open]:text-fg", className)} {...rest}>
        <Plus aria-hidden className="size-3.5" />
        {label}
      </button>
    );
  }
  return (
    <span className={cn("inline-flex h-8 items-center rounded-full bg-surface text-micro text-fg", className)}>
      <button ref={ref} type="button" className="flex h-full items-center gap-1 pl-3 pr-1" {...rest}>
        <span className="text-fg-muted">{label}:</span> {value}
      </button>
      {onClear && (
        <button type="button" aria-label={`Clear ${label}`} onClick={onClear} className="mr-1 inline-flex size-6 items-center justify-center rounded-full text-fg-muted hover:bg-surface-active hover:text-fg">
          <X className="size-3.5" />
        </button>
      )}
    </span>
  );
});
