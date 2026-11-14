"use client";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";
import { update, useOnboarding } from "@/hooks/useOnboarding";

const STEPS = [
  { title: "Welcome to the tour", body: "You're in read-only mode until you verify your email. Everything here uses SAMPLE data." },
  { title: "Runs live here", body: "Each run takes three workbooks, validates them and computes ECL by stage." },
  { title: "Results you can trace", body: "Open any run to see stage totals, exceptions and the seven reconciliation checks." },
  { title: "Lease Accounting", body: "Register leases, approve with maker-checker and close the month with journals." },
  { title: "Your team", body: "Admin → Members: invite reviewers and analysts with per-service roles." },
];

/** O3 guided tour card (glass, bottom-left beside the sidebar). Escape or "Skip tour" ends it. */
export function Tour() {
  const { tourStep } = useOnboarding();
  if (tourStep == null) return null;
  const s = STEPS[tourStep], last = tourStep === STEPS.length - 1;
  const end = () => update({ tourStep: null });
  return (
    <div role="dialog" aria-modal="false" aria-labelledby="tour-title" onKeyDown={(e) => e.key === "Escape" && end()} className="glass ring-inner fixed bottom-6 left-4 z-[var(--z-toast)] w-[360px] max-w-[calc(100vw-2rem)] rounded-panel border border-line p-5 animate-slide-up lg:left-[280px]">
      <div className="flex items-start gap-3">
        <p className="label-mono flex-1">Step {tourStep + 1} of {STEPS.length}</p>
        <button type="button" aria-label="Skip tour" onClick={end} className="text-fg-muted hover:text-fg"><X className="size-4" /></button>
      </div>
      <h2 id="tour-title" className="mt-2 text-h4">{s.title}</h2>
      <p className="mt-1 text-small text-fg-muted">{s.body}</p>
      <div className="mt-5 flex items-center gap-2">
        <span aria-hidden className="flex flex-1 gap-1">{STEPS.map((_, i) => <span key={i} className={cn("h-1.5 rounded-full", i === tourStep ? "w-5 bg-fg" : "w-1.5 bg-line-strong")} />)}</span>
        <Button variant="ghost" size="sm" disabled={tourStep === 0} onClick={() => update({ tourStep: tourStep - 1 })}>Back</Button>
        <Button size="sm" autoFocus onClick={() => (last ? end() : update({ tourStep: tourStep + 1 }))}>{last ? "Finish" : "Next"}</Button>
      </div>
      <button type="button" onClick={end} className="mt-3 text-micro text-fg-muted hover:text-fg">Skip tour</button>
    </div>
  );
}
