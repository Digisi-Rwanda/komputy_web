import { isComputed } from "@/lib/entitlements";
import { CheckCircle2, FileSpreadsheet, Lock, XCircle } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Accordion } from "@/components/molecules/Accordion";
import { KeyValue } from "@/components/molecules/StatCard";
import { Banner } from "@/components/molecules/Banner";
import { bytes, date } from "@/lib/format";
import type { Run } from "@/types/domain";

export type ReconCheck = { name: string; expected?: number | string | null; actual?: number | string | null; difference?: number | null; passed: boolean; detail?: string | null };
export type InputFile = { id: string; kind: string; filename: string; sha256: string; size: number; rows: number | null; sheets: number | null; status: string | null; warningsAccepted: boolean; at: string };
export type OutputFile = { kind: string; sha256: string; size: number; at: string };
const OUTPUT_LABEL: Record<string, [string, string]> = {
  LOAN_DETAIL: ["Loan detail.xlsx", "Every loan: stage, EAD, PD, LGD, ECL (Step 11)"], PORTFOLIO_SUMMARY: ["Portfolio summary.xlsx", "Totals by segment and stage"],
  PD_CALCS: ["PD calculations.xlsx", "Transition matrices and term structures"], LGD: ["LGD.xlsx", "Collateral allocation and discounting"],
  RUNDOWN: ["EAD rundown.xlsx", "Month by month projections"], ECL_SUMMARY: ["ECL summary.xlsx", "Headline figures"],
};
const fmt = (v: unknown) => (typeof v === "number" ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : String(v ?? "No data"));

/** R4 reconciliation: 7 checks, expandable calculations, example failed-check style. */
export function ReconciliationTab({ run, checks }: { run: Run; checks: ReconCheck[] }) {
  if (!isComputed(run)) return <Banner tone="info">Reconciliation runs after compute.</Banner>;
  const passed = checks.filter((c) => c.passed).length;
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-h4 text-fg">{passed === checks.length ? <CheckCircle2 className="size-5 text-positive" /> : <XCircle className="size-5 text-negative" />}{passed} of {checks.length} checks passed · tolerance 0.01</p>
      <Accordion defaultValue={checks.filter((c) => !c.passed).map((c) => c.name)} items={checks.map((c) => ({
        value: c.name,
        title: <span className="flex flex-wrap items-center gap-x-4 gap-y-1">{c.passed ? <CheckCircle2 aria-label="Passed" className="size-4 text-positive" /> : <XCircle aria-label="Failed" className="size-4 text-negative" />}<span className="w-56 text-fg">{c.name}</span>{c.difference != null && <span className="font-mono text-micro text-fg-body">Δ {fmt(c.difference)}</span>}</span>,
        content: <dl className="grid max-w-md grid-cols-2 gap-y-1 font-mono text-micro">{[["Expected", c.expected], ["Actual", c.actual], ["Difference", c.difference]].map(([k, v]) => <div key={String(k)} className="contents"><dt className="text-fg-muted">{String(k)}</dt><dd className="text-right text-fg">{fmt(v)}</dd></div>)}{c.detail && <p className="col-span-2 mt-2 font-sans text-fg-muted">{c.detail}</p>}</dl>,
      }))} />
    </div>
  );
}

/** R5 inputs: three file cards + settings snapshot; immutable once signed off. */
export function InputsTab({ run, files }: { run: Run; files: InputFile[] }) {
  if (!files.length) return <p className="rounded-panel border border-dashed border-line-strong p-6 text-center text-small text-fg-muted">No files uploaded yet.</p>;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {files.map((f) => (
          <section key={f.id} className="flex flex-col gap-3 rounded-panel border border-line p-5">
            <p className="flex items-center gap-2 text-small text-fg"><FileSpreadsheet aria-hidden className="size-4 text-positive" /><Badge>{f.kind}</Badge><span className="truncate">{f.filename}</span></p>
            <p className="font-mono text-micro text-fg-muted">{bytes(f.size)}{f.rows != null && ` · ${f.rows.toLocaleString("en-US")} rows`}{f.sheets != null && ` · ${f.sheets} sheet${f.sheets === 1 ? "" : "s"}`} · SHA {f.sha256.slice(0, 4)}…{f.sha256.slice(-3)}</p>
            <p className="text-micro text-fg-muted">Uploaded {date(f.at.slice(0, 10))}</p>
            <div className="flex flex-wrap gap-2">{f.status === "ok" ? <Badge tone="positive">Validation passed</Badge> : f.status === "warn" ? <Badge tone="warning">Passed with warnings{f.warningsAccepted ? " · accepted" : ""}</Badge> : f.status === "error" ? <Badge tone="negative">Failed validation</Badge> : <Badge>Not validated</Badge>}</div>
            <div className="mt-auto flex flex-wrap gap-2"><Button asChild size="sm" variant="secondary"><a href={`/api/ecl/runs/${run.id}/inputs/${f.kind.toLowerCase()}`}>Download original</a></Button></div>
          </section>
        ))}
      </div>
      <section className="rounded-panel border border-line p-5"><h3 className="mb-4 text-h4">Run settings</h3>
        <KeyValue columns={2} items={[["Engine", run.engine], ["Currency", run.currency], ["Reporting date", run.reportingDate || "From the EAD file"], ["Created by", run.createdBy]]} />
      </section>
      {run.status === "signed-off" && <p className="flex items-center gap-2 text-small text-fg-muted"><Lock className="size-4" />Inputs are immutable for signed off runs.</p>}
    </div>
  );
}

const FORMULAS = [
  ["PD: Markov transition matrix", "Money weighted matrix per segment, pooled and row-normalised; cure rate; S1 → S3 folded into S1 → S2; S3 absorbing; term structure Mⁿ for n = 1…299; marginal PD = (S3(n) − S3(n − 1)) / (1 − S3(n − 1))."],
  ["LGD: Collateral discounting", "Allocated = share × collateral; Discounted = Allocated × (1 − haircut) × (1 + EIR)^−years; LGW = max(0, 1 − discounted / EAD); LGD = LGW × (1 − cure rate)."],
  ["EAD: Projection", "Level payment PMT; balance = max(0, bal × (1 + r/12) − pmt); EAD includes up to 3 missed payments; Stage 1 12 months, Stage 2 to maturity, Stage 3 single row."],
  ["ECL", "Σ EAD × PD × LGD × (1 + EIR/12)^−t, capped at outstanding."],
  ["Known limitations", "Stages come from the input file (no SICR model); no macroeconomic scenarios in v1.3.0."],
];

/** R6 methodology: read-only, auditor-friendly. */
export function MethodologyTab({ run }: { run: Run }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <Accordion defaultValue={FORMULAS.map((f) => f[0])} items={FORMULAS.map(([t, body]) => ({ value: t, title: <span className="text-fg">{t}</span>, content: <code className="block whitespace-pre-wrap rounded-md bg-surface p-3 font-mono text-micro leading-relaxed text-fg-body">{body}</code> }))} />
      <aside className="flex h-fit flex-col gap-4 rounded-panel border border-line p-5">
        <div><p className="label-mono">Engine</p><p className="text-h3 text-fg">{run.engine}</p></div>
        <div><p className="label-mono">Spec</p><p className="text-small text-fg">ECL Calculation Specification v1.0</p></div>
        <div><p className="label-mono">Released</p><p className="text-small text-fg">14 Aug 2026</p></div>
      </aside>
    </div>
  );
}

/** R7 outputs: workbooks + bundle; empty before compute; trial watermark note. */
export function OutputsTab({ run, files, trial }: { run: Run; files: OutputFile[]; trial?: boolean }) {
  if (!isComputed(run)) return <p className="rounded-panel border border-dashed border-line-strong p-6 text-center font-mono text-small text-fg-muted">Outputs are generated after compute.</p>;
  if (!files.length) return <p className="rounded-panel border border-line p-6 text-center text-small text-fg-muted">Building the workbooks… this page updates when they&apos;re ready.</p>;
  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-line rounded-panel border border-line">
        {files.map((f) => { const [name, desc] = OUTPUT_LABEL[f.kind] ?? [`${f.kind}.xlsx`, ""]; return (
          <li key={f.kind} className="flex flex-wrap items-center gap-4 px-5 py-3">
            <FileSpreadsheet aria-hidden className="size-5 text-positive" />
            <span className="min-w-0 flex-1"><span className="block text-small text-fg">{name}</span><span className="block font-mono text-micro text-fg-muted">{desc}</span></span>
            <span className="font-mono text-micro text-fg-muted">{bytes(f.size)} · {date(f.at.slice(0, 10))}</span>
            <Button asChild size="sm" variant="secondary"><a href={`/api/ecl/runs/${run.id}/downloads/${f.kind.toLowerCase()}`}>Download</a></Button>
          </li>
        ); })}
        <li className="flex flex-wrap items-center gap-4 bg-raised px-5 py-4"><span className="flex-1 text-small text-fg">Download everything (.zip)</span><Button asChild size="sm"><a href={`/api/ecl/runs/${run.id}/downloads/bundle`}>Download bundle</a></Button></li>
      </ul>
      {trial && <p className="text-micro text-fg-muted">Trial runs include a TRIAL watermark on output files.</p>}
    </div>
  );
}
