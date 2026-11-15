"use client";
import { isComputed } from "@/lib/entitlements";
import { useState } from "react";
import { BarChart3, Download, FileText, PieChart, ShieldCheck, TriangleAlert, TrendingUp } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { Tooltip } from "@/components/molecules/Overlays";
import { Modal } from "@/components/organisms/Modal";
import { date } from "@/lib/format";
import type { Run } from "@/types/domain";

const REPORTS = [
  { id: "stage", icon: BarChart3, name: "Stage movement", desc: "IFRS 7 35H style: stage summary and migration", formats: ["XLSX", "CSV"] },
  { id: "rollforward", icon: TrendingUp, name: "ECL roll-forward", desc: "Opening → closing between two runs", formats: ["XLSX", "CSV"], twoRuns: true },
  { id: "coverage", icon: PieChart, name: "Coverage by stage and segment", desc: "Exposure, ECL and coverage", formats: ["XLSX", "CSV"] },
  { id: "exceptions", icon: TriangleAlert, name: "Exceptions register", desc: "All exceptions with the action taken", formats: ["XLSX", "CSV"] },
  { id: "recon", icon: ShieldCheck, name: "Reconciliation certificate", desc: "Every check, expected vs actual", formats: ["XLSX", "CSV"] },
  { id: "board", icon: FileText, name: "Board pack summary", desc: "Executive summary", formats: ["XLSX", "CSV"] },
];

type Export = { name: string; href: string; by: string; at: string; status: "ready" | "preparing"; size: string };

/** R14 export dialog: the engine builds the file from stored results; the browser downloads it directly. */
function ExportDialog({ report, runs, run, compare, onDone }: { report: (typeof REPORTS)[number]; runs: Run[]; run: string; compare: string; onDone: (e: Export) => void }) {
  const [open, setOpen] = useState(false);
  const [fmt, setFmt] = useState(report.formats[0]);
  const [from, setFrom] = useState(compare), [to, setTo] = useState(run);
  const label = (id: string) => runs.find((r) => r.id === id)?.name ?? id;
  const name = `${report.name}${report.twoRuns ? ` ${label(from)} → ${label(to)}` : ` · ${label(to)}`}.${fmt.toLowerCase()}`;
  const href = `/api/ecl/reports/${report.id}?run=${to}&fmt=${fmt.toLowerCase()}${report.twoRuns || (compare && compare !== run) ? `&compare=${report.twoRuns ? from : compare}` : ""}`;
  return (
    <Modal open={open} onOpenChange={setOpen} title={`Export ${report.name}`} trigger={<Button size="sm" className="w-full">Generate</Button>}
      footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button asChild icon={<Download />}><a href={href} onClick={() => { onDone({ name, href, by: "You", at: new Date().toISOString(), status: "ready", size: fmt }); setTimeout(() => setOpen(false), 300); }}>Download</a></Button></>}>
      <div className="flex flex-col gap-5">
        {report.twoRuns && <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-small text-fg-body">From run<Select value={from} onChange={(e) => setFrom(e.target.value)}>{runs.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></label>
          <label className="flex flex-col gap-1.5 text-small text-fg-body">To run<Select value={to} onChange={(e) => setTo(e.target.value)}>{runs.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></label>
        </div>}
        <div className="flex flex-col gap-1.5"><span className="text-small text-fg-body">Format</span><ToggleGroup label="Format" value={fmt} onChange={setFmt} options={report.formats.map((f) => ({ value: f, label: f }))} /></div>
        <p className="text-micro text-fg-muted">Built from the run&apos;s stored results. Figures in {runs.find((r) => r.id === to)?.currency ?? "the run currency"}; negatives in brackets.</p>
      </div>
    </Modal>
  );
}

/** R13 reports grid + recent exports. Reports need a signed-off run. */
export function Reports({ runs }: { runs: Run[] }) {
  const signed = runs.filter((r) => r.status === "signed-off");
  const computed = runs.filter(isComputed);
  const [run, setRun] = useState(signed[0]?.id ?? computed[0]?.id ?? "");
  const [cmp, setCmp] = useState(true);
  const [exports, setExports] = useState<Export[]>([]);
  const ok = computed.some((r) => r.id === run);
  const isSigned = signed.some((r) => r.id === run);
  const idx = computed.findIndex((r) => r.id === run);
  const prev = computed[idx + 1]?.id ?? "";
  if (!computed.length) return <p className="rounded-panel border border-line p-6 text-small text-fg-muted">Reports become available once a run is computed.</p>;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Select aria-label="Run" wrapperClassName="w-72" value={run} onChange={(e) => setRun(e.target.value)}>{computed.map((r) => <option key={r.id} value={r.id}>{r.name}{r.status === "signed-off" ? " · Signed off" : ""}</option>)}</Select>
        {prev && <Switch checked={cmp} onCheckedChange={setCmp} label={`Compare with ${computed[idx + 1]?.name}`} />}
      </div>
      {ok && !isSigned && <p className="rounded-card border border-warning/40 bg-warning-tint px-4 py-3 text-small text-fg">This run isn&apos;t signed off yet. Exports are marked as draft figures until a reviewer signs it off.</p>}
      <ul className="bg-blueprint grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 rounded-panel border border-line bg-canvas p-5">
            <r.icon aria-hidden className="size-6 text-fg" />
            <p className="text-small text-fg">{r.name}</p>
            <p className="flex-1 text-micro text-fg-muted">{r.desc}</p>
            <p className="flex gap-1">{r.formats.map((f) => <Badge key={f}>{f}</Badge>)}</p>
            {ok ? <ExportDialog report={r} runs={computed} run={run} compare={cmp && prev ? prev : run} onDone={(e) => setExports((x) => [e, ...x])} />
              : <Tooltip content="Reports need a computed run"><span><Button size="sm" className="w-full" disabled>Generate</Button></span></Tooltip>}
          </li>
        ))}
      </ul>
      <section className="flex flex-col gap-3">
        <h2 className="text-h4">Recent exports</h2>
        <ul className="divide-y divide-line rounded-panel border border-line">
          {exports.map((e, i) => <li key={e.name + i} className="flex flex-wrap items-center gap-4 px-5 py-3 text-small"><FileText aria-hidden className="size-4 text-fg-muted" /><span className="min-w-0 flex-1 text-fg">{e.name}</span><span className="text-micro text-fg-muted">{e.by} · {date(e.at.slice(0, 10))} {e.at.slice(11, 16)}</span><Button asChild size="sm" variant="secondary"><a href={e.href}>Download again</a></Button></li>)}
          {!exports.length && <li className="px-5 py-4 text-small text-fg-muted">Exports from this session appear here. Every export is also recorded in the audit log.</li>}
        </ul>
      </section>
    </div>
  );
}
