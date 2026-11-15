"use client";
import { useActionState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { joinWaitlist, type SimpleState } from "@/lib/actions/public";
import type { ServiceId } from "@/types/domain";

/** P3 waitlist: email + Join; success card "You're on the list". */
export function WaitlistForm({ service, serviceName }: { service: ServiceId; serviceName: string }) {
  const [state, action, pending] = useActionState<SimpleState, FormData>(joinWaitlist, null);
  if (state?.ok) {
    return (
      <div role="status" className="ring-inner flex max-w-md flex-col items-center gap-3 rounded-panel border border-line bg-raised p-8 text-center animate-scale-in">
        <CheckCircle2 aria-hidden className="size-12 text-positive" />
        <p className="text-h4 text-fg">You&apos;re on the list.</p>
        <p className="text-small text-fg-muted">We&apos;ll write to <span className="text-fg">{state.email}</span> when {serviceName} opens.</p>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="flex max-w-lg flex-col gap-2">
      <input type="hidden" name="service" value={service} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">Email</label>
        <div className="flex h-12 flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 focus-within:border-focus">
          <Mail aria-hidden className="size-4 text-fg-muted" />
          <input id="waitlist-email" name="email" type="email" required autoComplete="email" placeholder="Your email" aria-invalid={state?.ok === false || undefined} aria-describedby="waitlist-msg" className="min-w-0 flex-1 bg-transparent text-small text-fg outline-none placeholder:text-fg-subtle" />
        </div>
        <button type="submit" disabled={pending} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-small font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50">
          Join the waitlist<ArrowRight aria-hidden className="size-4" />
        </button>
      </div>
      <p id="waitlist-msg" role={state?.ok === false ? "alert" : undefined} className={state?.ok === false ? "text-micro text-negative" : "text-micro text-fg-muted"}>
        {state?.ok === false ? state.error : "We'll email you once, when it's ready to try."}
      </p>
    </form>
  );
}
