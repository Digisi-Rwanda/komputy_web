"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/atoms/Input";
import { Money } from "@/components/atoms/Numbers";
import { stageDot } from "@/components/atoms/StatusPill";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { PdMatrix } from "@/components/organisms/PdMatrix";
import { TimeSeries } from "@/components/organisms/TimeSeries";
import { cn } from "@/lib/cn";
import { ALLOCATION, LOAN_LOOKUP, PD_SEGMENTS, TERM, TREATMENT } from "@/data/wizard";

/** W6.A/B: transition matrix per segment + cumulative PD term structure. */
export function PdPreview() {
  const [seg, setSeg] = useState("Retail");
  const [view, setView] = useState("matrix");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup label="Preview" value={view} onChange={setView} options={[{ value: "matrix", label: "Matrix" }, { value: "term", label: "Term structure" }]} />
        {view === "matrix" && <ToggleGroup label="Segment" value={seg} onChange={setSeg} options={Object.keys(PD_SEGMENTS).map((s) => ({ value: s, label: s }))} />}
        <span className="ml-auto text-micro text-fg-muted">Pooled Jan-Nov 2026</span>
      </div>
      {view === "matrix" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-panel border border-line p-5"><PdMatrix rows={["S1", "S2", "S3"]} cols={["S1", "S2", "S3", "Offbooks"]} values={PD_SEGMENTS[seg]} caption={`${seg} transition matrix`} />
            <p className="mt-3 text-micro text-fg-muted">Cure rate (S3 → S1 + S3 → S2) = {(PD_SEGMENTS[seg][2][0] + PD_SEGMENTS[seg][2][1]).toFixed(4)}. After normalisation, S1 → S3 is folded into S1 → S2 and Stage 3 is absorbing.</p></div>
          <div className="flex flex-col gap-1 rounded-panel border border-line p-5"><p className="text-micro text-fg-muted">Observed transitions</p><p className="text-h3 text-fg tabular-nums">312,406</p><p className="text-micro text-fg-muted">Money-weighted</p></div>
        </div>
      ) : (
        <div className="rounded-panel border border-line p-5">
          <TimeSeries title="Cumulative PD by month" data={TERM} x="month" format={(v) => `${v.toFixed(1)} %`} series={[{ key: "Retail", label: "Retail", color: "var(--chart-1)", value: "Retail" }, { key: "SME", label: "SME", color: "var(--chart-6)", value: "SME" }, { key: "Corporate", label: "Corporate", color: "var(--chart-5)", value: "Corporate" }, { key: "Mortgage", label: "Mortgage", color: "var(--chart-2)", value: "Mortgage" }]} />
          <p className="mt-3 font-mono text-micro text-fg-muted">Month 12 marginal PD: Retail 0.0213 · SME 0.0398 · Corporate 0.0121 · Mortgage 0.0087</p>
        </div>
      )}
    </div>
  );
}

/** W6.C: one loan's month-by-month staging history. */
export function LoanLookup() {
  const [q, setQ] = useState(LOAN_LOOKUP.id);
  const hit = q.trim().toUpperCase() === LOAN_LOOKUP.id;
  return (
    <div className="flex flex-col gap-4">
      <Input wrapperClassName="max-w-sm" leading={<Search />} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a loan" placeholder="Loan ID" />
      {hit ? (
        <div className="flex flex-col gap-4 rounded-panel border border-line p-5">
          <p className="text-small text-fg"><span className="font-mono">{LOAN_LOOKUP.id}</span> · {LOAN_LOOKUP.segment}</p>
          <div className="relative overflow-x-auto"><table className="text-micro"><caption className="sr-only">Monthly staging for {LOAN_LOOKUP.id}</caption><tbody>
            <tr>{LOAN_LOOKUP.months.map((m) => <th key={m} scope="col" className="px-2 pb-1 font-normal text-fg-muted">{m}</th>)}</tr>
            <tr>{LOAN_LOOKUP.stages.map((s, i) => <td key={i} className="px-1"><span className={cn("inline-flex h-6 w-9 items-center justify-center rounded-md font-mono text-fg-inverse", stageDot[s as 1])}>S{s}</span></td>)}</tr>
            <tr>{LOAN_LOOKUP.amounts.map((a, i) => <td key={i} className="px-2 pt-1 text-right tabular-nums text-fg-body">{(a / 1000).toFixed(1)}k</td>)}</tr>
          </tbody></table></div>
          <p className="text-micro text-positive">{LOAN_LOOKUP.note}</p>
        </div>
      ) : <p className="text-small text-fg-muted">No loan “{q}” in this file. Try {LOAN_LOOKUP.id}.</p>}
    </div>
  );
}

/** W7.B: collateral allocation for one customer. */
export function LgdPreview() {
  const total = ALLOCATION.reduce((a, r) => a + r[5], 0);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-small text-fg-muted">Each customer&apos;s collateral is shared across their loans by exposure, then discounted. Example: customer CU-22817 · Residential property USD 54,240.00.</p>
      <div className="relative overflow-x-auto rounded-panel border border-line">
        <table className="w-full min-w-[620px] text-small tabular-nums"><caption className="sr-only">Collateral allocation preview</caption>
          <thead><tr className="border-b border-line text-fg-muted">{["Loan", "Share", "Allocated · USD", "Haircut", "Years", "Discounted · USD"].map((h, i) => <th key={h} scope="col" className={cn("px-4 py-2 font-normal", i ? "text-right" : "text-left")}>{h}</th>)}</tr></thead>
          <tbody>
            {ALLOCATION.map((r) => <tr key={r[0]} className="border-b border-line"><td className="px-4 py-2.5 font-mono text-micro text-fg">{r[0]}</td><td className="px-4 text-right">{(r[1] * 100).toFixed(1)} %</td><td className="px-4 text-right"><Money value={r[2]} /></td><td className="px-4 text-right">{Math.round(r[3] * 100)} %</td><td className="px-4 text-right">{r[4].toFixed(1)}</td><td className="px-4 text-right text-fg"><Money value={r[5]} /></td></tr>)}
            <tr><th scope="row" className="px-4 py-2.5 text-left font-normal text-fg">Total</th><td colSpan={4} /><td className="px-4 text-right text-fg"><Money value={total} /></td></tr>
          </tbody>
        </table>
      </div>
      <code className="w-fit rounded-md bg-surface px-3 py-2 font-mono text-micro text-fg-body">Discounted = Allocated × (1 − haircut) × (1 + EIR)^−years</code>
    </div>
  );
}

/** W8: how loans will be projected, by stage. */
export function EadPreview() {
  return (
    <div className="flex flex-col gap-3 rounded-panel border border-line p-5">
      <p className="text-small text-fg">How loans will be projected</p>
      {TREATMENT.map((t) => <p key={t.stage} className="flex items-center gap-3 text-small"><span aria-hidden className={cn("size-2 rounded-full", stageDot[t.stage])} /><span className="flex-1 text-fg-body">Stage {t.stage} · {t.rule}</span><span className="tabular-nums text-fg">{t.loans.toLocaleString("en-US")} loans</span></p>)}
      <p className="flex items-center gap-3 text-small"><span aria-hidden className="size-2 rounded-full bg-fg-muted" /><span className="flex-1 text-fg-body">Excluded (listed as exceptions)</span><span className="tabular-nums text-fg">18 loans</span></p>
      <p className="border-t border-line pt-3 text-micro text-fg-muted">48,312 loans included · 1,148,920 projection rows</p>
    </div>
  );
}
