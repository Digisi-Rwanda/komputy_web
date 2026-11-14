"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, XCircle } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { StatusPill } from "@/components/atoms/StatusPill";
import { FileDropzone } from "@/components/molecules/FileDropzone";
import { ProgressCircle } from "@/components/molecules/Progress";
import { Stepper } from "@/components/molecules/Stepper";
import { toast } from "@/components/organisms/Toaster";
import { download, toCsv } from "@/lib/csv";
import { leaseData } from "@/data/mock/index";

const STEPS = ["upload", "map", "validate", "preview", "commit"];
const FIELDS = ["Lease ID", "Counterparty", "Commencement date", "End date", "Payment amount", "Frequency", "Rate (%)", "Location", "Ignore"];

/** LC-02 imports: upload → map columns (auto + saved) → validate → preview → commit with progress. */
export function Imports({ initialStep = "upload" }: { initialStep?: string }) {
  const [step, setStep] = useState(STEPS.includes(initialStep) ? initialStep : "upload");
  const [map, setMap] = useState(leaseData.importMapping.map((m) => m[1] as string));
  const [ibrPercent, setIbrPercent] = useState(false);
  const [skip, setSkip] = useState(false);
  const [created, setCreated] = useState(0);
  const i = STEPS.indexOf(step);
  useEffect(() => { if (step !== "commit" || created >= 45) return; const t = setTimeout(() => setCreated((c) => Math.min(45, c + 9)), 300); return () => clearTimeout(t); }, [step, created]);
  const dupTarget = map.find((m, k) => m !== "Ignore" && map.indexOf(m) !== k);
  return (
    <div className="flex flex-col gap-6">
      <Stepper current={i} steps={["Upload", "Map columns", "Validate", "Preview", "Commit"].map((label) => ({ label }))} />
      {step === "upload" && <>
        <FileDropzone title="Drop a lease file here" hint=".xlsx or .csv · up to 10,000 rows" accept=".xlsx,.csv" maxMb={20} onFile={() => setStep("map")} />
        <p className="text-micro text-fg-muted"><a href="/templates/leases-import-template.csv" download className="text-link hover:underline">Download import template</a> · <button type="button" className="text-link hover:underline" onClick={() => setStep("map")}>Use Branches_2026.xlsx (example)</button></p>
        <section className="flex flex-col gap-2"><h2 className="text-h4">Recent imports</h2>
          <ul className="divide-y divide-line rounded-panel border border-line">{leaseData.imports.map(([id, f, rows, st, by, at]) => <li key={id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-small"><span className="font-mono text-micro text-fg">{id}</span><span className="flex-1 text-fg-body">{f} · {rows} rows</span><StatusPill tone={st === "committed" ? "positive" : st === "needs-fixing" ? "negative" : "neutral"}>{st === "needs-fixing" ? "Needs fixing" : st === "committed" ? "Committed" : "Cancelled"}</StatusPill><span className="text-micro text-fg-muted">{by} · {at}</span></li>)}</ul>
        </section>
      </>}
      {step === "map" && <>
        <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[620px] text-small"><caption className="sr-only">Column mapping</caption>
          <thead><tr className="border-b border-line text-fg-muted">{["Your column", "Ledgerline field", "Sample value"].map((h) => <th key={h} scope="col" className="px-4 py-2 text-left font-normal">{h}</th>)}</tr></thead>
          <tbody>{leaseData.importMapping.map(([col, , sample, auto], k) => <tr key={col} className="border-b border-line last:border-0"><td className="px-4 py-2 font-mono text-micro text-fg">{col}</td><td className="px-4 py-2"><span className="flex items-center gap-2"><Select aria-label={`Field for ${col}`} value={map[k]} invalid={map[k] === dupTarget} onChange={(e) => setMap((m) => m.map((x, j) => (j === k ? e.target.value : x)))} wrapperClassName="w-56">{FIELDS.map((f) => <option key={f}>{f}</option>)}</Select>{auto && <Badge tone="positive">Auto</Badge>}</span></td><td className="px-4 py-2 text-fg-body">{sample}</td></tr>)}</tbody></table></div>
        {dupTarget && <p role="alert" className="text-small text-negative">“{dupTarget}” is mapped twice.</p>}
        {!ibrPercent && <div className="flex flex-wrap items-center gap-3 rounded-card border border-warning/40 bg-warning-tint px-4 py-3 text-small text-fg"><AlertTriangle className="size-4 text-warning" />IBR values look like decimals (0.095). Treat as 9.5 %?<Button size="sm" variant="secondary" className="ml-auto" onClick={() => setIbrPercent(true)}>Yes, convert</Button></div>}
        <div className="flex flex-wrap items-end justify-between gap-3"><label className="flex flex-col gap-1.5 text-small text-fg-body">Save mapping as<Input defaultValue="Branch template" className="w-56" /></label><Button disabled={Boolean(dupTarget)} onClick={() => setStep("validate")}>Validate 48 rows</Button></div>
      </>}
      {step === "validate" && <>
        <p className="flex flex-wrap gap-2"><Badge tone="positive">41 valid</Badge><Badge tone="warning">4 warnings</Badge><Badge tone="negative">3 errors</Badge></p>
        <ul className="divide-y divide-line rounded-panel border border-line">{leaseData.importErrors.map(([row, msg]) => <li key={row} className="flex items-center gap-3 px-4 py-3 text-small"><XCircle className="size-4 text-negative" /><span className="w-16 font-mono text-micro text-fg-muted">Row {row}</span><span className="flex-1 text-fg-body">{msg}</span></li>)}</ul>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" icon={<Download />} onClick={() => download("IMP-0031-errors.csv", toCsv([["Row", "Error"], ...leaseData.importErrors.map((e) => [...e])]))}>Download errors (CSV)</Button><Button variant="secondary" onClick={() => setStep("upload")}>Fix in file and re-upload</Button><Button onClick={() => { setSkip(true); setStep("preview"); }}>Skip error rows</Button></div>
      </>}
      {step === "preview" && <>
        <section className="flex flex-col gap-1 rounded-panel border border-line p-5"><p className="text-h3 text-fg">45 leases will be created as drafts</p><p className="text-small text-fg-muted">Liability total USD 2,104,330.18{skip && " · 3 error rows skipped"}</p></section>
        <Switch label="Submit all for approval after import" />
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setStep("validate")}>Back</Button><Button onClick={() => { setCreated(0); setStep("commit"); }}>Commit import</Button></div>
      </>}
      {step === "commit" && <section className="flex flex-col items-center gap-4 rounded-panel border border-line p-8 text-center">
        {created < 45 ? <ProgressCircle value={created} max={45} size={120} label="Creating leases"><span className="font-mono text-small text-fg">{created} / 45</span></ProgressCircle> : <><CheckCircle2 className="size-12 text-positive" /><p className="text-h4 text-fg">45 drafts created · 3 rows skipped</p><div className="flex flex-wrap justify-center gap-3"><Link href="/leases/register?view=drafts" className="text-small text-link hover:underline">View in register (filtered to IMP-0031)</Link><button type="button" className="text-small text-link hover:underline" onClick={() => toast.success("Import report downloaded")}>Download import report</button></div></>}
      </section>}
    </div>
  );
}
