"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postBatch } from "@/lib/actions/leases";
import { CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Input } from "@/components/atoms/Input";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Modal } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import { download, toCsv } from "@/lib/csv";
import { money } from "@/lib/format";
import { useLeaseData } from "@/components/organisms/leases/LeaseData";

type Batch = import("@/server/dal/leases").LeaseBook["batches"][number];
const TONE = { approved: ["info", "Approved · not posted"], posted: ["positive", "Posted"], reversal: ["warning", "Reversal"] } as const;

/** LC-04 journals: batches list, balanced batch detail, "Mark as posted" with ERP reference. */
export function Journals() {
  const leaseData = useLeaseData();
  const router = useRouter();
  const batches: Batch[] = leaseData.batches;
  const [sel, setSel] = useState(batches.at(-1)?.id ?? "");
  const [erp, setErp] = useState("");
  const [ok, setOk] = useState(false);
  const b = batches.find((x) => x.id === sel);
  if (!b) return <p className="rounded-panel border border-line p-6 text-small text-fg-muted">No journal batches yet. Batches are generated during the month-end close.</p>;
  // Totals per account for the selected batch (lines are posted by the engine, Decimal-balanced).
  const acc = new Map<string, [number, number]>();
  for (const l of (b.raw?.lines ?? []) as { account: string; debit: string; credit: string }[]) { const c = acc.get(l.account) ?? [0, 0]; acc.set(l.account, [c[0] + Number(l.debit), c[1] + Number(l.credit)]); }
  const A: [string, string, number, number][] = [...acc.entries()].map(([a, [d, c]]) => [a, leaseData.batchAccounts.find((x) => x[0] === a)?.[1] ?? a, d, c]);
  const dr = A.reduce((s, r) => s + r[2], 0), cr = A.reduce((s, r) => s + r[3], 0);
  const post = async () => {
    const res = await postBatch(sel, erp);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`${sel} marked as posted · ${erp.trim()}`); setErp(""); setOk(false); router.refresh();
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <ul className="flex h-fit flex-col divide-y divide-line rounded-panel border border-line">
        {batches.map((x) => (
          <li key={x.id}><button type="button" aria-current={x.id === sel} onClick={() => setSel(x.id)} className={cn("flex w-full flex-col gap-1 px-4 py-3 text-left", x.id === sel ? "bg-surface" : "hover:bg-surface/60")}>
            <span className="flex items-center justify-between gap-2"><span className="font-mono text-micro text-fg">{x.id}</span><StatusPill tone={TONE[x.status][0]}>{TONE[x.status][1]}</StatusPill></span>
            <span className="text-micro text-fg-muted">{x.period} · {x.lines.toLocaleString()} lines · {money(x.total)}</span>
          </button></li>
        ))}
      </ul>
      <section className="flex flex-col gap-4 rounded-panel border border-line p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-mono text-h4 text-fg">{b.id}</h2><StatusPill tone={TONE[b.status][0]}>{TONE[b.status][1]}</StatusPill>
          {b.erp && <span className="text-micro text-fg-muted">ERP {b.erp}</span>}
          <span className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={<Download />} onClick={() => download(`${b.id}.csv`, toCsv([["Lease", "Account", "Kind", "Debit", "Credit"], ...((b.raw?.lines ?? []) as { leaseId: string; account: string; kind: string; debit: string; credit: string }[]).map((l) => [l.leaseId, l.account, l.kind, l.debit, l.credit])]))}>Export for ERP (CSV)</Button>
            {b.status === "approved" && <Modal title={`Mark ${b.id} as posted?`} description="Record the ERP document number so auditors can trace it." size="sm" trigger={<Button size="sm">Mark as posted</Button>}
              footer={<Button disabled={!erp.trim() || !ok} disabledReason={!erp.trim() ? "Enter the ERP document number" : !ok ? "Confirm the batch was posted" : undefined} onClick={() => void post()}>Mark as posted</Button>}>
              <div className="flex flex-col gap-4"><label className="flex flex-col gap-1.5 text-small text-fg-body">ERP document number<Input value={erp} onChange={(e) => setErp(e.target.value)} placeholder="SAP 5100004530" /></label>
                <Checkbox checked={ok} onCheckedChange={(v) => setOk(v === true)} label="I confirm this batch was posted in the ERP" /></div>
            </Modal>}
          </span>
        </div>
        <div className="relative overflow-x-auto"><table className="w-full min-w-[520px] text-small tabular-nums"><caption className="sr-only">Batch {b.id} by account</caption>
          <thead><tr className="text-fg-muted">{["Account", "Name", "Debit", "Credit"].map((h, k) => <th key={h} scope="col" className={`py-1.5 font-normal ${k > 1 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
          <tbody>{A.map(([a, n, d, c]) => <tr key={a} className="border-t border-line"><td className="py-2 font-mono text-micro text-fg">{a}</td><td className="text-fg-body">{n}</td><td className="text-right">{d ? money(d) : "—"}</td><td className="text-right">{c ? money(c) : "—"}</td></tr>)}</tbody>
          <tfoot><tr className="border-t border-line-strong text-fg"><td colSpan={2} className="py-2">Total</td><td className="text-right">{money(dr)}</td><td className="text-right">{money(cr)}</td></tr></tfoot></table></div>
        <p className={cn("flex items-center gap-2 text-small", Math.abs(dr - cr) < 0.005 ? "text-positive" : "text-negative")}><CheckCircle2 className="size-4" />{Math.abs(dr - cr) < 0.005 ? "Balanced · debits equal credits" : `Out of balance by ${money(dr - cr)}`}</p>
      </section>
    </div>
  );
}
