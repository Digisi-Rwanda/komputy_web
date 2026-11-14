"use client";
import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Money } from "@/components/atoms/Numbers";
import { NumberInput } from "@/components/atoms/NumberInput";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Textarea } from "@/components/atoms/Textarea";
import { Banner } from "@/components/molecules/Banner";
import { KeyValue } from "@/components/molecules/StatCard";
import { ConfirmDialog, Modal } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { leaseData } from "@/data/mock/index";

const STEPS = [
  { title: "Start close", owner: "AM", who: "Aline Mugisha" },
  { title: "Resolve issues", owner: "EU", who: "Eric Uwase" },
  { title: "Generate journals", owner: "EU", who: "Eric Uwase" },
  { title: "Confirm actual payments", owner: "EU", who: "Eric Uwase" },
  { title: "Review & sign off", owner: "JH", who: "Jean Habimana" },
  { title: "Lock period", owner: "AM", who: "Administrator only" },
];

/** LC-03 month-end close: guided steps with owners, payment confirmation, lock and audited reopen. */
export function MonthEndClose() {
  const [done, setDone] = useState(1);
  const [issues, setIssues] = useState(2);
  const [pays, setPays] = useState(leaseData.payments.map((p) => ({ ...p, confirmed: false })));
  const [locked, setLocked] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const S = leaseData.closeSummary;
  const advance = (n: number, msg: string) => { setDone(n + 1); toast.success(msg); };
  const body = (i: number) => {
    if (i === 1) return issues ? <div className="flex flex-col gap-2 text-small text-fg-body"><p>• LSE-0142 not approved — exclude or approve</p><p>• Rate curve change pending</p><Button size="sm" variant="secondary" className="w-fit" onClick={() => { setIssues(0); advance(1, "Issues resolved"); }}>Resolve issues</Button></div> : null;
    if (i === 2) return <div className="flex flex-wrap items-center gap-3 text-small text-fg-body"><span>142 leases · est. 1,284 lines</span><Button size="sm" onClick={() => advance(2, "Journals generated · JB-2026-10 · balanced")}>Generate journals</Button></div>;
    if (i === 3) return (
      <div className="flex flex-col gap-3">
        <div className="relative overflow-x-auto"><table className="w-full min-w-[620px] text-small tabular-nums"><caption className="sr-only">Scheduled versus actual payments</caption>
          <thead><tr className="text-fg-muted">{["Lease", "Due", "Scheduled", "Actual", "Difference", "Status"].map((h, k) => <th key={h} scope="col" className={`py-1.5 font-normal ${k > 1 && k < 5 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
          <tbody>{pays.map((p, k) => { const diff = p.actual - p.scheduled; return <tr key={p.lease} className="border-t border-line"><td className="py-2 font-mono text-micro text-fg">{p.lease} <span className="font-sans text-fg-muted">{p.name}</span></td><td>31 Oct</td><td className="text-right">{money(p.scheduled)}</td><td className="text-right"><NumberInput aria-label={`Actual payment ${p.lease}`} kind="money" defaultValue={p.actual} wrapperClassName="ml-auto w-32" onValueChange={(n) => setPays((x) => x.map((y, j) => (j === k ? { ...y, actual: n ?? 0 } : y)))} /></td><td className={cn("text-right", diff < 0 ? "text-warning" : "")}>{diff ? money(diff) : "0.00"}</td><td className="pl-3"><StatusPill tone={diff ? "warning" : "positive"}>{diff < 0 ? "Short-paid" : diff > 0 ? "Over-paid" : "Matched"}</StatusPill></td></tr>; })}</tbody></table></div>
        <p className="text-micro text-fg-muted">38 payments · {money(S.payments)} scheduled in total</p>
        <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => toast("Choose a bank statement file (CSV)")}>Upload payments file</Button><Button size="sm" onClick={() => advance(3, `Confirmed ${pays.filter((p) => p.actual === p.scheduled).length} matched · differences sent to review`)}>Confirm {pays.filter((p) => p.actual === p.scheduled).length} matched</Button></div>
      </div>
    );
    if (i === 4) return <Button size="sm" className="w-fit" onClick={() => advance(4, "Signed off by Jean Habimana")}>Sign off (as Jean Habimana)</Button>;
    if (i === 5) return locked ? null : <ConfirmDialog danger={false} title="Lock period?" description="Journals and schedules for Oct 2026 become read-only." confirmLabel="Lock period" onConfirm={() => { setLocked(true); setDone(6); toast.success("October 2026 locked"); }} trigger={<Button size="sm" className="w-fit" icon={<Lock />}>Lock October 2026</Button>} />;
    return null;
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-h3">October 2026 close</h2>
        <StatusPill tone={locked ? "positive" : "info"}>{locked ? "Locked" : "In progress"}</StatusPill>
        <span className="font-mono text-micro text-fg-muted">Started 1 Nov 2026 by Aline Mugisha</span>
        <span className="ml-auto text-small text-fg-muted">Due 5 Nov · 3 days left</span>
      </div>
      <ol className="flex flex-wrap gap-2">{[["Jul", "Locked"], ["Aug", "Locked"], ["Sep", "Locked"], ["Oct", locked ? "Locked" : "In progress"], ["Nov", "Future"]].map(([m, s]) => <li key={m}><StatusPill tone={s === "Locked" ? "positive" : s === "In progress" ? "info" : "neutral"}>{m} · {s}</StatusPill></li>)}</ol>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <ol className="flex flex-col gap-3">
          {STEPS.map((s, i) => {
            const isDone = i < done, cur = i === done;
            return (
              <li key={s.title} className={cn("flex flex-col gap-3 rounded-panel border p-4", cur ? "border-fg" : "border-line")}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn("inline-flex size-7 items-center justify-center rounded-full font-mono text-micro", isDone ? "bg-positive text-fg-inverse" : cur ? "bg-fg text-fg-inverse" : "border border-line-strong text-fg-muted")}>{isDone ? <Check className="size-3.5" /> : i + 1}</span>
                  <span className="flex-1 text-small text-fg">{s.title}</span>
                  {i === 1 && issues > 0 && !isDone && <StatusPill tone="warning">{issues} issues</StatusPill>}
                  <StatusPill tone={isDone ? "positive" : cur ? "info" : "neutral"}>{isDone ? "Done" : cur ? "Ready" : "Waiting"}</StatusPill>
                  <span className="flex items-center gap-2 text-micro text-fg-muted"><Avatar initials={s.owner} size="xs" />{s.who}</span>
                </div>
                {cur && body(i)}
              </li>
            );
          })}
        </ol>
        <aside className="flex h-fit flex-col gap-3 rounded-panel border border-line p-5"><h2 className="text-h4">Close summary</h2><KeyValue columns={1} items={[["Liability", <Money key="l" value={S.liability} />], ["Interest Oct", <Money key="i" value={S.interest} />], ["Depreciation Oct", <Money key="d" value={S.depreciation} />], ["Payments Oct", <Money key="p" value={S.payments} />]]} /></aside>
      </div>
      {locked && <Banner tone="info" action={<Modal title="Reopen October 2026?" description="Reopening is audited and notifies the controller." size="sm" trigger={<Button size="sm" variant="secondary">Reopen</Button>}
        footer={<Button variant="danger" disabled={reopenReason.trim().length < 10} disabledReason={reopenReason.trim().length < 10 ? "Give a reason (min 10 characters)" : undefined} onClick={() => { setLocked(false); setDone(5); setReopenReason(""); toast("Period reopened · logged"); }}>Reopen period</Button>}>
        <label className="flex flex-col gap-1.5 text-small text-fg-body">Reason (logged)<Textarea value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} maxLength={500} /></label></Modal>}>
        October 2026 is locked. Journals and schedules are read-only.</Banner>}
    </div>
  );
}
