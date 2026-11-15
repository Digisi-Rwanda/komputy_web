"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { Banner } from "@/components/molecules/Banner";
import { CardSelector } from "@/components/molecules/CardSelector";
import { Field } from "@/components/molecules/Field";
import { Sheet } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { money } from "@/lib/format";
import { addEvent, previewEvent } from "@/lib/actions/leases";
import { useLeaseData } from "@/components/organisms/leases/LeaseData";

const EVENTS: [string, string, string][] = [
  ["index", "Index / rent change", "New payment from a date; original rate kept (IFRS 16.42(b))"],
  ["term", "Term change", "Extension or shortening; revised rate"],
  ["modification", "Modification", "Scope decrease and/or new payment; revised rate"],
  ["termination", "Termination", "Early end; derecognise, optional penalty"],
];

/** LB-05 add event: the engine previews the remeasurement (liability, ROU, journals); submitting sends it for approval. */
export function AddEvent({ leaseId, rev, currency }: { leaseId: string; rev: number; currency: string }) {
  const b = useLeaseData(), router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  const [kind, setKind] = useState("index");
  const [eff, setEff] = useState(""), [amount, setAmount] = useState(""), [end, setEnd] = useState(""), [scope, setScope] = useState(""), [penalty, setPenalty] = useState(""), [rate, setRate] = useState(""), [reason, setReason] = useState("");
  const reviewers = b.members.filter((m) => m.id !== b.me && (m.role === "reviewer" || m.role === "administrator"));
  const [approver, setApprover] = useState("");
  const [preview, setPreview] = useState<null | { segment: Record<string, string>; journals: { account: string; debit: string; credit: string }[] }>(null);
  const ev = () => ({
    event: kind, effectiveDate: eff, reason: reason.trim(),
    ...(amount && (kind === "index" || kind === "modification") ? { newAmount: amount } : {}),
    ...(end && kind === "term" ? { newEndDate: end } : {}),
    ...(scope && kind === "modification" ? { scopeDecrease: String(Number(scope) / 100) } : {}),
    ...(kind === "termination" ? { terminationPenalty: penalty || "0" } : {}),
    ...(rate && (kind === "term" || kind === "modification") ? { rate: { value: String(Number(rate) / 100), source: "override", reason: "Revised rate at remeasurement" } } : {}),
  });
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(eff) && reason.trim().length >= 5;
  const run = (fn: () => Promise<void>) => start(async () => { try { await fn(); } catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong."); } });
  const doPreview = () => run(async () => { const r = await previewEvent(leaseId, ev()); if (!r.ok) throw new Error(r.error); setPreview(r.data); });
  const submit = () => run(async () => {
    const to = approver || reviewers[0]?.id;
    if (!to) throw new Error("There's no reviewer to send this to.");
    const r = await addEvent(leaseId, rev, to, ev());
    if (!r.ok) throw new Error(r.error);
    toast.success("Event submitted for approval"); setOpen(false); setPreview(null); router.refresh();
  });
  const seg = preview?.segment ?? {};
  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPreview(null); }} width="w-[640px]" title="Add event" trigger={<Button icon={<Icon name="plus" />}>Add event</Button>}
      footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="secondary" loading={busy} disabled={!valid} disabledReason={!valid ? "Add the effective date and a reason" : undefined} onClick={doPreview}>Preview impact</Button><Button loading={busy} disabled={!preview} disabledReason={!preview ? "Preview the impact first" : undefined} onClick={submit}>Submit for approval</Button></>}>
      <div className="flex flex-col gap-5">
        <CardSelector label="Event type" columns={2} value={kind} onChange={(v) => { setKind(v); setPreview(null); }} options={EVENTS.map(([v, t, d]) => ({ value: v, title: t, description: d }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Effective date" id="ev-eff" help="Must fall in an open period"><Input type="date" value={eff} onChange={(e) => { setEff(e.target.value); setPreview(null); }} /></Field>
          {(kind === "index" || kind === "modification") && <Field label={`New payment · ${currency}`} id="ev-amt"><Input numeric value={amount} onChange={(e) => { setAmount(e.target.value); setPreview(null); }} /></Field>}
          {kind === "term" && <Field label="New end date" id="ev-end"><Input type="date" value={end} onChange={(e) => { setEnd(e.target.value); setPreview(null); }} /></Field>}
          {kind === "modification" && <Field label="Scope decrease (%)" id="ev-scope"><Input numeric value={scope} onChange={(e) => { setScope(e.target.value); setPreview(null); }} /></Field>}
          {kind === "termination" && <Field label={`Termination penalty · ${currency}`} id="ev-pen"><Input numeric value={penalty} onChange={(e) => { setPenalty(e.target.value); setPreview(null); }} /></Field>}
          {(kind === "term" || kind === "modification") && <Field label="Revised rate (%)" id="ev-rate" help="Blank keeps the current rate"><Input numeric value={rate} onChange={(e) => { setRate(e.target.value); setPreview(null); }} /></Field>}
          <Field label="Approver" id="ev-appr"><Select value={approver || reviewers[0]?.id || ""} onChange={(e) => setApprover(e.target.value)}>{reviewers.length ? reviewers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>) : <option value="">No reviewer available</option>}</Select></Field>
        </div>
        <Field label="Reason" id="ev-reason" required><Textarea value={reason} maxLength={500} onChange={(e) => { setReason(e.target.value); setPreview(null); }} /></Field>
        {preview ? (
          <section className="glass ring-inner flex flex-col gap-3 rounded-panel border border-line p-5">
            <p className="text-small text-fg">Remeasurement on {eff}</p>
            <p className="text-small tabular-nums text-fg-body">Liability before {money(Number(seg.liabBefore ?? 0))} → after <span className="text-fg">{money(Number(seg.L0 ?? 0))}</span> · Δ {money(Number(seg.liabAdj ?? 0))}</p>
            <p className="text-small tabular-nums text-fg-body">ROU before {money(Number(seg.rouBefore ?? 0))} → after <span className="text-fg">{money(Number(seg.R0 ?? 0))}</span>{Number(seg.gainLoss ?? 0) ? ` · gain/loss ${money(Number(seg.gainLoss))}` : ""}</p>
            <ul className="flex flex-col gap-1 rounded-md bg-surface px-3 py-2 font-mono text-micro text-fg-body">{preview.journals.slice(0, 8).map((j, i) => <li key={i}>{Number(j.debit) ? `Dr ${j.account} ${money(Number(j.debit))}` : `Cr ${j.account} ${money(Number(j.credit))}`}</li>)}</ul>
            <p className="font-mono text-micro text-fg-muted">Preview by the engine — nothing changes until approved.</p>
          </section>
        ) : <Banner tone="info">Preview the impact to see the remeasurement and journals before submitting.</Banner>}
      </div>
    </Sheet>
  );
}
