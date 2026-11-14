import { ArrowRight, ArrowLeftRight } from "lucide-react";

/** Thin state-machine strip (AC4, blueprint §3.2). */
export function StateMachine() {
  const s = (t: string) => <span className="rounded-full border border-line px-2.5 py-1 font-mono text-micro text-fg-body">{t}</span>;
  const a = <ArrowRight aria-hidden className="size-3.5 text-fg-muted" />;
  return (
    <figure className="flex flex-wrap items-center gap-2 rounded-panel border border-line p-4" aria-label="Access state machine: none, requested, trial, active, suspended, expired">
      {s("none")}{a}{s("requested")}{a}{s("trial")}{a}{s("active")}<ArrowLeftRight aria-hidden className="size-3.5 text-fg-muted" />{s("suspended")}{a}{s("expired")}
      <figcaption className="w-full pt-1 text-micro text-fg-muted">Trial can also end (trial ended → read-only). Expired stays read-only for 90 days, then archived.</figcaption>
    </figure>
  );
}
