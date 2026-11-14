"use client";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { NumberInput } from "@/components/atoms/NumberInput";
import { Textarea } from "@/components/atoms/Textarea";
import { CardSelector } from "@/components/molecules/CardSelector";
import { Field } from "@/components/molecules/Field";
import { Banner } from "@/components/molecules/Banner";
import { Sheet } from "@/components/organisms/Modal";
import { Waterfall } from "@/components/organisms/Waterfall";
import { remeasure } from "@/lib/lease";
import { money } from "@/lib/format";
import type { Lease } from "@/types/domain";

const EVENTS = [["extension", "Extension or reduction of term", "Extend or reduce the lease term."], ["payments", "Change in payments", "Update payment amounts."], ["rate", "Rate / index change", "Update the rate or index."], ["partial", "Partial termination", "Terminate part of the lease."], ["full", "Full termination", "End the lease early."], ["correction", "Correction of an error", "Requires Administrator."]] as const;

/** LB-05 add event with live remeasurement impact; locked-period guard; submit goes to approval. */
export function AddEvent({ lease, closingBefore, onSubmitted }: { lease: Lease; closingBefore: number; onSubmitted: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("extension");
  const [eff, setEff] = useState(`${Number(lease.end?.slice(0, 4) ?? 2029)}-01-01`);
  const [extra, setExtra] = useState(2);
  const [rate, setRate] = useState<number | null>(0.104);
  const [reason, setReason] = useState("Board approved extension, minute BM-2028-07.");
  const locked = eff < "2026-10-01";
  const payment = 10000;
  const impact = remeasure(closingBefore, { payment, frequency: "annual", timing: "arrears", rate: rate ?? 0 }, 1 + extra);
  const valid = !locked && (rate ?? 0) > 0 && reason.trim().length >= 10;
  return (
    <Sheet open={open} onOpenChange={setOpen} width="w-[640px]" title={`Add event · ${lease.id}`} trigger={<Button icon={<Icon name="plus" />}>Add event</Button>}
      footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!valid} disabledReason={!valid ? "Fix the highlighted fields" : undefined} onClick={() => { onSubmitted(`Extension proposed — +${extra} years`); setOpen(false); }}>Submit event for approval</Button></>}>
      <div className="flex flex-col gap-5">
        <CardSelector label="Event type" columns={2} value={kind} onChange={setKind} options={EVENTS.map(([v, t, d]) => ({ value: v, title: t, description: d, disabled: v === "correction", icon: v === "correction" ? <Lock className="size-4" /> : undefined }))} />
        {kind === "extension" ? <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Effective date" id="ev-eff" error={locked ? "Effective date falls in a locked period. Choose a date in an open period." : undefined}><Input type="date" value={eff} onChange={(e) => setEff(e.target.value)} /></Field>
            <Field label="Additional years" id="ev-x"><NumberInput defaultValue={extra} onValueChange={(n) => setExtra(Math.max(0, Math.round(n ?? 0)))} /></Field>
            <Field label="Revised rate" id="ev-rate" help="Curve, 5 yrs: 10.40 %"><NumberInput kind="percent" defaultValue={rate} onValueChange={setRate} /></Field>
            <Field label="Payments" id="ev-pay"><Input readOnly value={`${money(payment)} annual in arrears`} /></Field>
          </div>
          <Field label="Reason" id="ev-reason" required error={reason.trim().length < 10 ? "Explain the event (min 10 characters)." : undefined}><Textarea value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} /></Field>
          <section className="glass ring-inner flex flex-col gap-3 rounded-panel border border-line p-5">
            <p className="text-small text-fg">Remeasurement on {eff}</p>
            <p className="text-small tabular-nums text-fg-body">Liability before {money(impact.before)} → after <span className="text-fg">{money(impact.after)}</span> · Δ <span className="text-warning">{impact.delta >= 0 ? "+" : ""}{money(impact.delta)}</span></p>
            <p className="text-small text-fg-body">ROU adjustment {impact.delta >= 0 ? "+" : ""}{money(impact.delta)}</p>
            <Waterfall title="Remeasurement" height={160} increaseIsBad={false} steps={[{ label: "Old liability", value: impact.before, kind: "total" }, { label: "Remeasure", value: impact.delta }, { label: "New liability", value: impact.after, kind: "total" }]} />
            <p className="rounded-md bg-surface px-3 py-2 font-mono text-micro text-fg-body">Dr ROU asset {money(impact.delta)} / Cr Lease liability {money(impact.delta)}</p>
            <p className="font-mono text-micro text-fg-muted">Preview only — nothing changes until approved.</p>
          </section>
        </> : <Banner tone="info">This event type uses the same flow: details, live impact, then approval.</Banner>}
      </div>
    </Sheet>
  );
}
