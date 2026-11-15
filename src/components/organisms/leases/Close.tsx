"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Money } from "@/components/atoms/Numbers";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Textarea } from "@/components/atoms/Textarea";
import { Banner } from "@/components/molecules/Banner";
import { KeyValue } from "@/components/molecules/StatCard";
import { ConfirmDialog, Modal } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { closeStep, confirmScheduledPayments, lockPeriod, postBatch, reopenPeriod } from "@/lib/actions/leases";
import { useLeaseData } from "@/components/organisms/leases/LeaseData";

const STEPS: { id: string; title: string; who: string }[] = [
  { id: "cutoff", title: "Cut-off: all leases for the month approved", who: "Preparer" },
  { id: "rates", title: "Rates and setup current", who: "Preparer" },
  { id: "events", title: "Events in the period recorded", who: "Preparer" },
  { id: "generate", title: "Generate journals", who: "Preparer" },
  { id: "matching", title: "Match actual payments", who: "Preparer" },
  { id: "reconcile", title: "Reconcile to the general ledger", who: "Preparer" },
  { id: "approve", title: "Approve the journal batch", who: "Reviewer (not the preparer)" },
  { id: "post", title: "Post to the ERP", who: "Reviewer / poster" },
];
const monthLabel = (k: string) => new Date(`${k}-01T00:00:00`).toLocaleString("en-GB", { month: "long", year: "numeric" });

/** LC-02/03 month-end close: engine-driven steps with maker-checker, then lock (reopen is audited). */
export function MonthEndClose() {
  const b = useLeaseData(), router = useRouter();
  const [busy, start] = useTransition();
  const c = b.close as null | { period: string; steps: { id: string; status: string; doneBy?: string; doneAt?: string; note?: string }[]; batchId: string | null; startedBy: string; startedAt: string };
  const periods = (b.state.periods ?? []) as { key: string; status: string }[];
  const period = c?.period ?? periods.find((p) => p.status === "open")?.key ?? b.period;
  const locked = periods.find((p) => p.key === period)?.status === "locked";
  const [note, setNote] = useState(""), [warn, setWarn] = useState(false), [erp, setErp] = useState(""), [reason, setReason] = useState("");
  const S = b.closeSummary;
  const run = (f: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => {
    const r = await f();
    if (!r.ok) { toast.error(r.error ?? "The engine refused this step."); if (/warning|reason/i.test(r.error ?? "")) setWarn(true); return; }
    toast.success(ok); setNote(""); setWarn(false); router.refresh();
  });
  const stepOf = (id: string) => c?.steps.find((s) => s.id === id)?.status ?? "locked";
  const current = STEPS.find((s) => !["done", "warning"].includes(stepOf(s.id)))?.id;
  const who = (id?: string) => b.members.find((m) => m.id === id)?.name ?? "—";

  if (!c) return (
    <div className="flex flex-col gap-4">
      <h2 className="text-h3">{monthLabel(period)} close</h2>
      {!b.setupDone ? <Banner tone="warning">Finish Lease Accounting setup before closing a month.</Banner>
        : <Banner tone="info" action={<Button size="sm" loading={busy} onClick={() => run(() => closeStep(period, "start"), `${monthLabel(period)} close started`)}>Start the close</Button>}>No close is running for {monthLabel(period)}. Starting it runs the cut-off checks.</Banner>}
    </div>
  );

  const body = (id: string) => {
    if (id === "generate") return <Button size="sm" loading={busy} className="w-fit" onClick={() => run(() => closeStep(period, "generate"), "Journals generated · balanced")}>Generate journals</Button>;
    if (id === "matching") return (
      <div className="flex flex-col gap-3">
        {b.payments.length > 0 && <div className="relative overflow-x-auto"><table className="w-full min-w-[620px] text-small tabular-nums"><caption className="sr-only">Scheduled versus actual payments</caption>
          <thead><tr className="text-fg-muted">{["Lease", "Date", "Expected", "Actual", "Difference", "Match"].map((h, k) => <th key={h} scope="col" className={`py-1.5 font-normal ${k > 1 && k < 5 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
          <tbody>{b.payments.map((p) => { const diff = p.actual - p.scheduled; return <tr key={p.id} className="border-t border-line"><td className="py-2 font-mono text-micro text-fg">{p.lease} <span className="font-sans text-fg-muted">{p.name}</span></td><td>{p.due}</td><td className="text-right">{money(p.scheduled)}</td><td className="text-right">{money(p.actual)}</td><td className={cn("text-right", diff < 0 ? "text-warning" : "")}>{diff ? money(diff) : "0.00"}</td><td className="pl-3"><StatusPill tone={p.match === "matched" ? "positive" : "warning"}>{p.match}</StatusPill></td></tr>; })}</tbody></table></div>}
        <div className="flex flex-wrap gap-2"><Button size="sm" loading={busy} onClick={() => run(() => confirmScheduledPayments(period), "Scheduled payments confirmed")}>Confirm scheduled payments</Button>
          <Button size="sm" variant="secondary" loading={busy} onClick={() => run(() => closeStep(period, `steps/matching/complete`, { note, acceptWarning: warn }), "Matching done")}>Mark matching done</Button></div>
      </div>
    );
    if (id === "post") return (
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1.5 text-small text-fg-body">ERP document reference<Input value={erp} maxLength={100} onChange={(e) => setErp(e.target.value)} placeholder="e.g. SAP 5100004412" /></label>
        <Button size="sm" loading={busy} disabled={!erp.trim() || !c.batchId} onClick={() => run(() => postBatch(c.batchId!, erp), "Batch posted")}>Mark as posted</Button>
      </div>
    );
    return (
      <div className="flex flex-col gap-2">
        {warn && <label className="flex flex-col gap-1.5 text-small text-fg-body">Reason for accepting the warning (logged)<Textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} /></label>}
        <Button size="sm" loading={busy} className="w-fit" onClick={() => run(() => closeStep(period, `steps/${id}/complete`, { note, acceptWarning: warn }), `${STEPS.find((s) => s.id === id)!.title} · done`)}>{id === "approve" ? "Approve batch" : warn ? "Accept and continue" : "Mark done"}</Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-h3">{monthLabel(period)} close</h2>
        <StatusPill tone={locked ? "positive" : "info"}>{locked ? "Locked" : "In progress"}</StatusPill>
        <span className="font-mono text-micro text-fg-muted">Started {c.startedAt?.slice(0, 10)} by {who(c.startedBy)}</span>
      </div>
      <ol className="flex flex-wrap gap-2">{periods.slice(-6).map((p) => <li key={p.key}><StatusPill tone={p.status === "locked" ? "positive" : p.key === period ? "info" : "neutral"}>{p.key} · {p.status}</StatusPill></li>)}</ol>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <ol className="flex flex-col gap-3">
          {STEPS.map((s, i) => {
            const st = stepOf(s.id), isDone = st === "done" || st === "warning", cur = s.id === current && !locked;
            const meta = c.steps.find((x) => x.id === s.id);
            return (
              <li key={s.id} className={cn("flex flex-col gap-3 rounded-panel border p-4", cur ? "border-fg" : "border-line")}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn("inline-flex size-7 items-center justify-center rounded-full font-mono text-micro", isDone ? "bg-positive text-fg-inverse" : cur ? "bg-fg text-fg-inverse" : "border border-line-strong text-fg-muted")}>{isDone ? <Check className="size-3.5" /> : i + 1}</span>
                  <span className="flex-1 text-small text-fg">{s.title}</span>
                  <StatusPill tone={st === "warning" ? "warning" : isDone ? "positive" : cur ? "info" : "neutral"}>{st === "warning" ? "Done with warning" : isDone ? "Done" : cur ? "Ready" : "Waiting"}</StatusPill>
                  <span className="text-micro text-fg-muted">{isDone ? `${who(meta?.doneBy)} · ${meta?.doneAt?.slice(0, 10)}` : s.who}</span>
                </div>
                {meta?.note && <p className="text-micro text-fg-muted">“{meta.note}”</p>}
                {cur && body(s.id)}
              </li>
            );
          })}
        </ol>
        <aside className="flex h-fit flex-col gap-3 rounded-panel border border-line p-5"><h2 className="text-h4">Close summary</h2><KeyValue columns={1} items={[["Lease liability", <Money key="l" value={S.liability} />], ["Interest (YTD)", <Money key="i" value={S.interest} />], ["Payments (YTD)", <Money key="p" value={S.payments} />]]} />
          {!locked && !current && <ConfirmDialog danger={false} title={`Lock ${monthLabel(period)}?`} description="Journals and schedules for the period become read-only." confirmLabel="Lock period" onConfirm={() => run(() => lockPeriod(period), `${monthLabel(period)} locked`)} trigger={<Button size="sm" icon={<Lock />}>Lock {monthLabel(period)}</Button>} />}
        </aside>
      </div>
      {locked && <Banner tone="info" action={<Modal title={`Reopen ${monthLabel(period)}?`} description="Reopening is audited and reverses the posted batch." size="sm" trigger={<Button size="sm" variant="secondary">Reopen</Button>}
        footer={<Button variant="danger" loading={busy} disabled={reason.trim().length < 10} disabledReason={reason.trim().length < 10 ? "Give a reason (min 10 characters)" : undefined} onClick={() => run(() => reopenPeriod(period, reason), "Period reopened · logged")}>Reopen period</Button>}>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Reason (logged)<Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} /></label></Modal>}>
        {monthLabel(period)} is locked. Journals and schedules are read-only.</Banner>}
    </div>
  );
}
