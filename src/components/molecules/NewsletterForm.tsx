"use client";
import { useActionState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { subscribe, type SimpleState } from "@/lib/actions/public";
import { cn } from "@/lib/cn";

/** Pill email field + round submit (footer, updates). Real server action with validation and success state. */
export function NewsletterForm({ id = "newsletter", className, placeholder = "Work email" }: { id?: string; className?: string; placeholder?: string }) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(subscribe, null);
  if (state?.ok) {
    return <p role="status" className={cn("flex items-center gap-2 text-small text-fg", className)}><Check aria-hidden className="size-4 text-positive" />Subscribed — we&apos;ll write to {state.email} monthly.</p>;
  }
  return (
    <form action={action} noValidate className={cn("flex w-full max-w-sm flex-col gap-1.5", className)}>
      <div className="flex items-center gap-2 rounded-full bg-surface p-1 pl-4 focus-within:ring-2 focus-within:ring-focus">
        <label htmlFor={id} className="sr-only">Work email</label>
        <input id={id} name="email" type="email" required placeholder={placeholder} autoComplete="email" aria-invalid={state?.ok === false || undefined} aria-describedby={state?.ok === false ? `${id}-err` : undefined} className="min-w-0 flex-1 bg-transparent text-small text-fg outline-none placeholder:text-fg-subtle" />
        <button type="submit" disabled={pending} aria-label="Subscribe" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg disabled:opacity-50">
          {pending ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <ArrowRight className="size-4" />}
        </button>
      </div>
      {state?.ok === false && <p id={`${id}-err`} role="alert" className="pl-4 text-micro text-negative">{state.error}</p>}
    </form>
  );
}
