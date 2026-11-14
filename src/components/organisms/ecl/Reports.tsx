"use client";
import { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, Download, FileText, PieChart, ShieldCheck, TriangleAlert, TrendingUp } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Select } from "@/components/atoms/Select";
import { Switch } from "@/components/atoms/Switch";
import { ProgressBar } from "@/components/molecules/Progress";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { Tooltip } from "@/components/molecules/Overlays";
import { Modal } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { date } from "@/lib/format";
import type { Run } from "@/types/domain";

const REPORTS = [
  { id: "stage", icon: BarChart3, name: "Stage movement", desc: "IFRS 7 35H style", formats: ["PDF", "XLSX", "CSV"] },
  { id: "rollforward", icon: TrendingUp, name: "ECL roll-forward", desc: "Opening → closing between two runs", formats: ["PDF", "XLSX"], twoRuns: true },
  { id: "coverage", icon: PieChart, name: "Coverage by stage and segment", desc: "Exposure, ECL and coverage", formats: ["PDF", "XLSX"] },
  { id: "exceptions", icon: TriangleAlert, name: "Exceptions register", desc: "All exceptions and waivers", formats: ["PDF", "XLSX"] },
  { id: "recon", icon: ShieldCheck, name: "Reconciliation certificate", desc: "Run reconciliation summary", formats: ["PDF"] },
  { id: "board", icon: FileText, name: "Board pack summary (PDF)", desc: "Executive summary", formats: ["PDF"] },
];

type Export = { name: string; by: string; at: string; status: "ready" | "preparing"; size: string };

/** R14 export dialog with progress → ready. */
function ExportDialog({ report, runs, run, compare, onDone }: { report: (typeof REPORTS)[number]; runs: Run[]; run: string; compare: string; onDone: (e: Export) => void }) {
  const [open, setOpen] = useState(false);
  const [fmt, setFmt] = useState(report.formats[report.formats.length > 1 ? 1 : 0]);
  const [from, setFrom] = useState(compare), [to, setTo] = useState(run);
  const [inc, setInc] = useState({ stage: true, segment: true, loans: false });
  const [pct, setPct] = useState<number | null>(null);
  useEffect(() => {
    if (pct === null || pct >= 100) return;
    const t = setTimeout(() => setPct((p) => Math.min(100, (p ?? 0) + 19)), 300);
    return () => clearTimeout(t);
  }, [pct]);
  const name = `${report.name}${report.twoRuns ? ` ${from}→${to}` : ` ${to}`}.${fmt.toLowerCase()}`;
  useEffect(() => { if (pct === 100) onDone({ name, by: "Aline Mugisha", at: new Date().toISOString(), status: "ready", size: inc.loans ? "18.6 MB" : "2.4 MB" }); }, [pct]); // eslint-disable-line react-hooks/exhaustive-deps -- fire once when the export completes
  return (
    <Modal open={open} onOpenChange={(v) => { setOpen(v); if (!v) setPct(null); }} title={`Export ${report.name.replace(" (PDF)", "")}`} trigger={<Button size="sm" className="w-full">Generate</Button>}
      footer={pct === 100 ? <Button icon={<Download />} onClick={() => { toast.success(`${name} downloaded`); setOpen(false); setPct(null); }}>Download</Button> : <><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button loading={pct !== null} onClick={() => setPct(0)}>Export</Button></>}>
      <div className="flex flex-col gap-5">
        {report.twoRuns && <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-small text-fg-body">From run<Select value={from} onChange={(e) => setFrom(e.target.value)}>{runs.map((r) => <option key={r.id}>{r.id}</option>)}</Select></label>
          <label className="flex flex-col gap-1.5 text-small text-fg-body">To run<Select value={to} onChange={(e) => setTo(e.target.value)}>{runs.map((r) => <option key={r.id}>{r.id}</option>)}</Select></label>
        </div>}
        <div className="flex flex-col gap-1.5"><span className="text-small text-fg-body">Format</span><ToggleGroup label="Format" value={fmt} onChange={setFmt} options={report.formats.map((f) => ({ value: f, label: f }))} /></div>
        <fieldset className="flex flex-col gap-2"><legend className="mb-1 text-small text-fg-body">Include</legend>
          <Checkbox checked={inc.stage} onCheckedChange={(v) => setInc({ ...inc, stage: v === true })} label="Stage detail" />
          <Checkbox checked={inc.segment} onCheckedChange={(v) => setInc({ ...inc, segment: v === true })} label="Segment detail" />
          <Checkbox checked={inc.loans} onCheckedChange={(v) => setInc({ ...inc, loans: v === true })} label="Loan-level appendix" description="Adds 48,312 rows" />
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-small text-fg-body">Currency<Select defaultValue="USD"><option>USD</option></Select></label>
          <label className="flex flex-col gap-1.5 text-small text-fg-body">Number format<Select defaultValue="paren"><option value="paren">1,234.56 / (1,234.56)</option><option value="minus">1,234.56 / −1,234.56</option></Select></label>
        </div>
        {pct !== null && (pct < 100 ? <div aria-live="polite" className="flex flex-col gap-2"><ProgressBar value={pct} label="Preparing export" showValue /><span className="text-micro text-fg-muted">Preparing export…</span></div>
          : <p role="status" className="flex items-center gap-2 text-small text-fg"><CheckCircle2 className="size-4 text-positive" />Ready · {inc.loans ? "18.6 MB" : "2.4 MB"}</p>)}
      </div>
    </Modal>
  );
}

/** R13 reports grid + recent exports. Reports need a signed-off run. */
export function Reports({ runs, initial }: { runs: Run[]; initial: Export[] }) {
  const signed = runs.filter((r) => r.status === "signed-off");
  const [run, setRun] = useState(signed[0]?.id ?? runs[0].id);
  const [cmp, setCmp] = useState(true);
  const [exports, setExports] = useState(initial);
  const ok = signed.some((r) => r.id === run);
  const prev = signed[signed.findIndex((r) => r.id === run) + 1]?.id ?? "RUN-0137";
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Select aria-label="Run" wrapperClassName="w-72" value={run} onChange={(e) => setRun(e.target.value)}>{runs.filter((r) => r.totalEcl || r.status === "draft").map((r) => <option key={r.id} value={r.id}>{r.id} · {r.name}</option>)}</Select>
        <Switch checked={cmp} onCheckedChange={setCmp} label={`Compare with ${prev}`} />
      </div>
      {!ok && <p className="rounded-card border border-warning/40 bg-warning-tint px-4 py-3 text-small text-fg">Reports need a signed-off run. Pick a signed-off run to generate.</p>}
      <ul className="bg-blueprint grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 rounded-panel border border-line bg-canvas p-5">
            <r.icon aria-hidden className="size-6 text-fg" />
            <p className="text-small text-fg">{r.name}</p>
            <p className="flex-1 text-micro text-fg-muted">{r.desc}</p>
            <p className="flex gap-1">{r.formats.map((f) => <Badge key={f}>{f}</Badge>)}</p>
            {ok ? <ExportDialog report={r} runs={signed} run={run} compare={cmp ? prev : run} onDone={(e) => setExports((x) => [e, ...x])} />
              : <Tooltip content="Reports need a signed-off run"><span><Button size="sm" className="w-full" disabled>Generate</Button></span></Tooltip>}
          </li>
        ))}
      </ul>
      <section className="flex flex-col gap-3">
        <h2 className="text-h4">Recent exports</h2>
        <ul className="divide-y divide-line rounded-panel border border-line">
          {exports.map((e, i) => <li key={e.name + i} className="flex flex-wrap items-center gap-4 px-5 py-3 text-small"><FileText aria-hidden className="size-4 text-fg-muted" /><span className="min-w-0 flex-1 text-fg">{e.name}</span><span className="text-micro text-fg-muted">{e.by} · {date(e.at.slice(0, 10))} {e.at.slice(11, 16)} · {e.size}</span><Button size="sm" variant="secondary" onClick={() => toast.success(`${e.name} downloaded`)}>Download</Button></li>)}
        </ul>
      </section>
    </div>
  );
}
