"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Money } from "@/components/atoms/Numbers";
import { KeyValue } from "@/components/molecules/StatCard";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { Sheet } from "@/components/organisms/Modal";
import { download, toCsv } from "@/lib/csv";
import type { Exception } from "@/types/domain";
import type { Tone } from "@/types/ui";

const TONE: Record<Exception["category"], Tone> = { "Input validation": "info", "PD match": "neutral", "ECL cap": "warning", Reconciliation: "negative" };

/** R3 exceptions: category filter, table, detail drawer (input row, rule, acknowledgement), CSV export. */
export function ExceptionsTab({ rows, runId }: { rows: Exception[]; runId: string }) {
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState<Exception | null>(null);
  const list = cat === "all" ? rows : rows.filter((r) => r.category === cat);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup label="Category" value={cat} onChange={setCat} options={[{ value: "all", label: "All", count: rows.length }, ...Object.entries(rows.reduce<Record<string, number>>((a, x) => ({ ...a, [x.category]: (a[x.category] ?? 0) + 1 }), {})).map(([k, v]) => ({ value: k, label: k, count: v }))]} />
        <Button size="sm" variant="secondary" className="ml-auto" icon={<Download />} onClick={() => download(`${runId}-exceptions.csv`, toCsv([["Category", "Loan", "Rule", "Detail", "Impact", "Amount"], ...list.map((r) => [r.category, r.loan, r.rule, r.detail, r.impact, r.amount])]))}>Download exceptions (CSV)</Button>
      </div>
      <div className="relative overflow-x-auto rounded-panel border border-line">
        <table className="w-full min-w-[760px] text-small"><caption className="sr-only">Exceptions</caption>
          <thead><tr className="border-b border-line text-fg-muted">{["Category", "Loan", "Rule", "Detail", "Impact", "Amount · USD"].map((h, i) => <th key={h} scope="col" className={`px-4 py-2 font-normal ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} onClick={() => setOpen(r)} className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-hover">
                <td className="px-4 py-3"><Badge tone={TONE[r.category]}>{r.category}</Badge></td>
                <td className="px-4"><button type="button" onClick={(e) => { e.stopPropagation(); setOpen(r); }} className="font-mono text-micro text-fg hover:underline">{r.loan}</button></td>
                <td className="px-4 font-mono text-micro">{r.rule}</td><td className="px-4 text-fg-body">{r.detail}</td><td className="px-4 text-fg-body">{r.impact}</td>
                <td className="px-4 text-right tabular-nums"><Money value={r.amount} signed /></td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-fg-muted">No exceptions in this category.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-micro text-fg-muted">Showing {list.length} examples. The full register is in the run bundle.</p>
      <Sheet open={open !== null} onOpenChange={(v) => !v && setOpen(null)} title="Exception details" footer={<Button variant="secondary" onClick={() => setOpen(null)}>Close</Button>}>
        {open && <div className="flex flex-col gap-5">
          <KeyValue columns={1} items={[["Category", open.category], ["Loan", open.loan], ["Rule", open.rule], ["Detail", open.detail], ["Impact", open.impact]]} />
          {open.input && <div><p className="mb-2 text-micro text-fg-muted">Input row</p><KeyValue columns={2} items={open.input} /></div>}
          <div><p className="mb-1 text-micro text-fg-muted">Acknowledgement</p><p className="text-small text-fg-body">{open.ack ?? "Not acknowledged: included in the exceptions register."}</p></div>
        </div>}
      </Sheet>
    </div>
  );
}
