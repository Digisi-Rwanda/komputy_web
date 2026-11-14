"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Check, Pencil } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { MetaChip } from "@/components/atoms/Chip";
import { cn } from "@/lib/cn";
import { date } from "@/lib/format";
import { toast } from "@/components/organisms/Toaster";
import { maxStep, setDraft, STEPS, useDraft, type Draft } from "@/hooks/useRunDraft";

const LABELS = ["Setup", "PD data", "LGD data", "EAD data", "Review", "Compute", "Sign-off"];
const PHASE: Record<Draft["phase"], [string, "neutral" | "info" | "negative" | "warning" | "positive"]> = { draft: ["Draft", "neutral"], computing: ["Computing", "info"], "compute-failed": ["Failed", "negative"], computed: ["Ready to submit", "info"], submitted: ["Needs review", "warning"], returned: ["Returned", "warning"], "signed-off": ["Signed off", "positive"] };

function SavedAgo({ at }: { at: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t); }, []);
  if (!at) return <span>Not saved yet</span>;
  const s = Math.max(1, Math.round((now - at) / 1000));
  return <span>Draft saved {s < 60 ? `${s} seconds` : `${Math.round(s / 60)} min`} ago</span>;
}

/** Wizard header (inline-editable name, chips, Save & exit) + clickable stepper (completed steps only) + sticky footer. */
export function WizardShell({ step, children, footer, resetMarks = [] }: { step: number; children: ReactNode; footer?: ReactNode; resetMarks?: number[] }) {
  const d = useDraft();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const reach = maxStep(d);
  const locked = d.phase === "submitted" || d.phase === "signed-off";
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-5">
        <nav aria-label="Breadcrumb" className="text-small text-fg-muted"><Link href="/ecl" className="hover:text-fg">Expected Credit Loss</Link> / <Link href="/ecl/runs" className="hover:text-fg">Runs</Link> / <span className="text-fg-body">New run</span></nav>
        <div className="flex flex-wrap items-center gap-2">
          {editing && !locked ? (
            <input autoFocus aria-label="Run name" defaultValue={d.name} maxLength={80} onBlur={(e) => { setDraft({ name: e.target.value.trim() || d.name }); setEditing(false); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditing(false); }} className="rounded-input border border-focus bg-surface px-2 text-h3 text-fg outline-none" />
          ) : (
            <h1 className="flex items-center gap-2 text-h3 tracking-[-0.02em]">{d.name}{!locked && <button type="button" aria-label="Rename run" onClick={() => setEditing(true)} className="text-fg-muted hover:text-fg"><Pencil className="size-4" /></button>}</h1>
          )}
          {d.sample && <Badge mono tone="info">Sample</Badge>}
          <MetaChip>{d.id}</MetaChip><Badge tone={PHASE[d.phase][1]}>{PHASE[d.phase][0]}</Badge><MetaChip>{date(d.reportingDate)}</MetaChip><MetaChip>{d.currency}</MetaChip><MetaChip>Engine {d.engine}</MetaChip>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setDraft({}); toast.success("Draft saved", { description: "Continue any time from Runs." }); router.push("/ecl/runs"); }}>Save &amp; exit</Button>
        </div>
        <ol className="flex w-full items-start overflow-x-auto pb-1">
          {LABELS.map((label, i) => {
            const n = i + 1, on = n === step, reachable = n <= Math.max(reach, step) && !on;
            const warned = i >= 1 && i <= 3 && d.files[STEPS[i] as "pd"].status === "accepted" && d.files[STEPS[i] as "pd"].outcome === "warnings";
            const circle = <span className={cn("relative inline-flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-micro", n < step || (n <= reach && n < 5 && i > 0 && d.files[STEPS[i] as "pd"]?.status === "accepted") ? "bg-accent text-white" : on ? "bg-fg text-fg-inverse ring-4 ring-ring-light" : "border border-line-strong text-fg-muted")}>
              {n < step ? <Check className="size-3.5" /> : n}{warned && <span role="img" aria-label="accepted with warnings" className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-canvas bg-warning" />}</span>;
            return (
              <li key={label} className="flex min-w-24 flex-1 items-start last:flex-none">
                {reachable ? (
                  <Link href={`/ecl/runs/new/${STEPS[i]}`} className="flex flex-col items-center gap-2 px-1 text-center hover:opacity-80">{circle}<span className="text-micro whitespace-nowrap text-fg-muted">{label}</span>{resetMarks.includes(n) && <span className="text-[11px] text-warning">will reset</span>}</Link>
                ) : (
                  <span aria-current={on ? "step" : undefined} className="flex flex-col items-center gap-2 px-1 text-center">{circle}<span className={cn("text-micro whitespace-nowrap", on ? "text-fg" : "text-fg-muted")}>{label}</span>{resetMarks.includes(n) && <span className="text-[11px] text-warning">will reset</span>}</span>
                )}
                {i < 6 && <span aria-hidden className={cn("mt-3.5 h-px flex-1", n < step ? "bg-accent" : "bg-line-strong")} />}
              </li>
            );
          })}
        </ol>
      </header>
      {children}
      {footer && (
        <div className="glass sticky bottom-4 z-[var(--z-sticky)] flex flex-wrap items-center gap-3 rounded-full border border-line py-2 pl-5 pr-2">
          <span className="text-micro text-fg-muted" aria-live="polite"><SavedAgo at={d.savedAt} /></span>
          <span className="ml-auto flex flex-wrap items-center gap-2">{footer}</span>
        </div>
      )}
    </div>
  );
}

/** Phones: uploads are desktop-only; everything else is read-only friendly (W17). */
export const DesktopOnlyNote = () => <p className="rounded-card border border-line px-4 py-3 text-small text-fg-muted md:hidden">Uploads and validation are available on desktop. You can follow progress and approve here.</p>;
