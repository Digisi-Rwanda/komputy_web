import Link from "next/link";
import { CheckCircle2, FileSpreadsheet, Lock, XCircle } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Accordion } from "@/components/molecules/Accordion";
import { KeyValue } from "@/components/molecules/StatCard";
import { Banner } from "@/components/molecules/Banner";
import { REQUIREMENTS } from "@/data/wizard";
import { getCollateralSetup, getSegmentsSetup, getThresholds } from "@/data/mock/index";
import { outputs, reconciliation } from "@/data/mock/results";
import { DownloadButton } from "@/components/organisms/ecl/DownloadButton";
import type { Run } from "@/types/domain";

/** R4 reconciliation: 7 checks, expandable calculations, example failed-check style. */
export function ReconciliationTab({ run }: { run: Run }) {
  if (!run.totalEcl) return <Banner tone="info">Reconciliation runs after compute.</Banner>;
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-h4 text-fg"><CheckCircle2 className="size-5 text-positive" />7 of 7 checks passed · tolerance 0.01</p>
      <Accordion defaultValue={["Row coverage"]} items={reconciliation.map((c) => ({
        value: c.title,
        title: <span className="flex flex-wrap items-center gap-x-4 gap-y-1"><CheckCircle2 aria-label="Passed" className="size-4 text-positive" /><span className="w-40 text-fg">{c.title}</span><span className="font-mono text-micro text-fg-body">{c.formula}</span></span>,
        content: c.detail ? <dl className="grid max-w-md grid-cols-2 gap-y-1 font-mono text-micro">{c.detail.map(([k, v]) => <div key={k} className="contents"><dt className="text-fg-muted">{k}</dt><dd className="text-right text-fg">{v}</dd></div>)}</dl> : <p className="text-fg-muted">Both sides match within tolerance.</p>,
      }))} />
      <div className="flex items-center gap-3 rounded-card border border-negative/40 bg-negative-tint px-5 py-3 opacity-70"><XCircle aria-hidden className="size-4 text-negative" /><p className="flex-1 text-small text-fg">Example: failed check <span className="block text-micro text-fg-muted">How a failure would look — ECL cap comparison shows a difference.</span></p><span className="font-mono text-small text-negative">0.42</span></div>
    </div>
  );
}

/** R5 inputs: three file cards + settings snapshot; immutable once signed off. */
export function InputsTab({ run }: { run: Run }) {
  const files = [["pd", "PD", 2], ["lgd", "LGD", 1], ["ead", "EAD", 2]] as const;
  const col = getCollateralSetup(), th = getThresholds();
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {files.map(([k, name, w]) => { const r = REQUIREMENTS[k]; return (
          <section key={k} className="flex flex-col gap-3 rounded-panel border border-line p-5">
            <p className="flex items-center gap-2 text-small text-fg"><FileSpreadsheet aria-hidden className="size-4 text-positive" />{r.defaultFile.replace("Nov", "Sep")}</p>
            <p className="font-mono text-micro text-fg-muted">{r.sizeMb} MB · {r.rows} · SHA {r.sha}</p>
            <p className="text-micro text-fg-muted">Uploaded by {run.createdBy} · 30 Sep 2026</p>
            <div className="flex flex-wrap gap-2"><Badge tone="positive">Validation passed</Badge><Badge tone="warning">{w} warning{w > 1 ? "s" : ""}</Badge></div>
            <div className="mt-auto flex flex-wrap gap-2"><DownloadButton label="Download original" name={`${name} input`} /><Button asChild size="sm" variant="ghost"><Link href={`/ecl/runs/new/${k}`}>View validation report</Link></Button></div>
          </section>
        ); })}
      </div>
      <section className="rounded-panel border border-line p-5"><h3 className="mb-4 text-h4">Settings snapshot</h3>
        <KeyValue columns={2} items={[["Segments", getSegmentsSetup().filter((s) => s.active).map((s) => s.name).join(", ")], ["Collateral types", col.map((c) => `${c.name} ${Math.round(c.haircut * 100)} % / ${c.months} mo`).join(" · ")], ["Thresholds", `Max month gap ${th[0].value} · min transitions ${th[1].value} · Offbooks ${Math.round(th[2].value * 100)} %`], ["Engine", run.engine]]} />
      </section>
      {run.status === "signed-off" && <p className="flex items-center gap-2 text-small text-fg-muted"><Lock className="size-4" />Inputs are immutable for signed-off runs.</p>}
    </div>
  );
}

const FORMULAS = [
  ["PD — Markov transition matrix", "Money-weighted matrix per segment, pooled and row-normalised; cure rate; S1 → S3 folded into S1 → S2; S3 absorbing; term structure Mⁿ for n = 1…299; marginal PD = (S3(n) − S3(n − 1)) / (1 − S3(n − 1))."],
  ["LGD — Collateral discounting", "Allocated = share × collateral; Discounted = Allocated × (1 − haircut) × (1 + EIR)^−years; LGW = max(0, 1 − discounted / EAD); LGD = LGW × (1 − cure rate)."],
  ["EAD — Projection", "Level payment PMT; balance = max(0, bal × (1 + r/12) − pmt); EAD includes up to 3 missed payments; Stage 1 12 months, Stage 2 to maturity, Stage 3 single row."],
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
export function OutputsTab({ run, trial }: { run: Run; trial?: boolean }) {
  if (!run.totalEcl) return <p className="rounded-panel border border-dashed border-line-strong p-6 text-center font-mono text-small text-fg-muted">Outputs are generated after compute.</p>;
  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-line rounded-panel border border-line">
        {outputs.map(([name, desc, mb]) => (
          <li key={name} className="flex flex-wrap items-center gap-4 px-5 py-3">
            <FileSpreadsheet aria-hidden className="size-5 text-positive" />
            <span className="min-w-0 flex-1"><span className="block text-small text-fg">{name}</span><span className="block font-mono text-micro text-fg-muted">{desc}</span></span>
            <span className="font-mono text-micro text-fg-muted">{mb} MB · 30 Sep 2026, 11:10</span>
            <DownloadButton label="Download" name={name} />
          </li>
        ))}
        <li className="flex flex-wrap items-center gap-4 bg-raised px-5 py-4"><span className="flex-1 text-small text-fg">Download bundle (.zip, 48.2 MB)</span><DownloadButton label="Download bundle" name="Run bundle" primary /></li>
      </ul>
      {trial && <p className="text-micro text-fg-muted">Trial runs include a TRIAL watermark on output files.</p>}
    </div>
  );
}
