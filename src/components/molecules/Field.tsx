import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Label } from "@/components/atoms/Label";

/** Label + control + help/error. Wires id, aria-describedby and aria-invalid onto the child control. */
export function Field({ label, id, help, error, required, children, className, optional }: {
  label: ReactNode; id: string; help?: ReactNode; error?: string; required?: boolean; optional?: boolean; children: ReactElement<Record<string, unknown>>; className?: string;
}) {
  const desc = error ? `${id}-error` : help ? `${id}-help` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children, { id, "aria-describedby": desc, "aria-required": required || undefined, invalid: Boolean(error) || undefined })
    : children;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
        {optional && <span className="text-fg-muted"> (optional)</span>}
      </Label>
      {control}
      {error ? <p id={desc} role="alert" className="text-micro text-negative">{error}</p> : help && <p id={desc} className="text-micro text-fg-muted">{help}</p>}
    </div>
  );
}

/** Settings layout: title + description on the left, controls on the right (stacks on mobile). */
export function FormSection({ title, description, children, className }: { title: ReactNode; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("grid gap-6 border-t border-line py-8 first:border-0 md:grid-cols-[240px_1fr]", className)}>
      <div>
        <h3 className="text-h4">{title}</h3>
        {description && <p className="mt-1 text-small text-fg-muted">{description}</p>}
      </div>
      <div className="flex max-w-xl flex-col gap-5">{children}</div>
    </section>
  );
}
