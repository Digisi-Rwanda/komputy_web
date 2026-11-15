"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Circle, Download, FileSpreadsheet, Info, Loader2, RefreshCw, RotateCcw, XCircle } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Textarea } from "@/components/atoms/Textarea";
import { Banner } from "@/components/molecules/Banner";
import { FileDropzone } from "@/components/molecules/FileDropzone";
import { ProgressBar } from "@/components/molecules/Progress";
import { ToggleGroup } from "@/components/molecules/Tabs";
import { Modal } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import { download, toCsv } from "@/lib/csv";
import { REQUIREMENTS, type Criterion } from "@/data/wizard";
import { acceptValidation } from "@/lib/actions/ecl";
import { hydrate, uploadFile, validate } from "@/lib/wizard-engine";
import { setDraft, setFile, useDraft, type Dataset } from "@/hooks/useRunDraft";
import { ECL_REQUIRED, precheckXlsx } from "@/lib/xlsx-precheck";
import { DesktopOnlyNote, WizardShell } from "@/components/organisms/ecl/Shell";
import { showCode } from "@/lib/code";

const NAME: Record<Dataset, string> = { pd: "PD", lgd: "LGD", ead: "EAD" };
const NEXT: Record<Dataset, string> = { pd: "lgd", lgd: "ead", ead: "review" };
const PREV: Record<Dataset, string> = { pd: "setup", lgd: "pd", ead: "lgd" };
const STEP_N: Record<Dataset, number> = { pd: 2, lgd: 3, ead: 4 };
const VALIDATING = { pd: ["Reading workbook", "Detecting header rows", "Checking every row", "Building transition matrices", "Computing term structure"], lgd: ["Reading workbook", "Matching collateral columns", "Checking every row", "Allocating collateral"], ead: ["Reading workbook", "Checking every row", "Matching PD curves", "Planning projections"] };
const ICON = { passed: [CheckCircle2, "text-positive"], warning: [AlertTriangle, "text-warning"], error: [XCircle, "text-negative"] } as const;

function Requirements({ k }: { k: Dataset }) {
  const r = REQUIREMENTS[k];
  return (
    <section className="flex h-fit flex-col gap-4 rounded-panel border border-line p-5">
      <h2 className="text-h4">{r.title}</h2>
      <p className="text-small text-fg-muted">{r.intro}</p>
      <ul className="flex flex-col gap-1.5">{r.columns.map((c) => <li key={c} className="flex items-center gap-2 font-mono text-micro text-fg-body"><span aria-hidden className="size-1.5 rounded-full bg-fg-muted" />{c}</li>)}</ul>
      {r.aliases && <p className="text-micro text-fg-muted">{r.aliases}</p>}
      <div className="relative overflow-x-auto rounded-md border border-line"><table className="w-full font-mono text-[11px]"><caption className="sr-only">Example row</caption><tbody>{r.example.map((row, i) => <tr key={i} className={i ? "text-fg-body" : "text-fg-muted"}>{row.map((c, j) => <td key={j} className="whitespace-nowrap px-2 py-1">{c}</td>)}</tr>)}</tbody></table></div>
      <a href={r.template} download className="inline-flex items-center gap-1.5 text-small text-link hover:underline"><Download aria-hidden className="size-4" />Download {NAME[k]} template</a>
    </section>
  );
}

function CriterionRow({ c, open, onToggle }: { c: Criterion; open: boolean; onToggle: () => void }) {
  const [I, cl] = ICON[c.status];
  const expandable = Boolean(c.explain || c.sample);
  return (
    <li>
      <button type="button" disabled={!expandable} aria-expanded={expandable ? open : undefined} onClick={onToggle} className="flex w-full flex-wrap items-center gap-3 px-5 py-3 text-left disabled:cursor-default">
        <I aria-hidden className={cn("size-4 shrink-0", cl)} />
        <span className="min-w-0 flex-1"><span className="block text-small text-fg"><span className="mr-2 font-mono text-micro text-fg-muted">{showCode(c.id)}</span>{c.title}</span>{c.detail && <span className="block text-micro text-fg-muted">{c.detail}</span>}</span>
        <span className={cn("text-micro capitalize", cl)}>{c.status === "passed" ? "Passed" : c.status}</span>
        {c.affected && <span className="w-28 text-right font-mono text-micro text-fg-muted">{c.affected}</span>}
        {expandable && <ChevronDown aria-hidden className={cn("size-4 text-fg-muted transition-transform", open && "rotate-180")} />}
      </button>
      {open && expandable && (
        <div className="flex flex-col gap-3 px-5 pb-4 pl-12">
          {c.explain && <p className="max-w-2xl text-small text-fg-body">{c.explain}</p>}
          {c.sample && <div className="relative overflow-x-auto rounded-md border border-line"><table className="text-micro"><caption className="sr-only">Sample affected rows</caption><tbody>{c.sample.map((r, i) => <tr key={i} className={i ? "text-fg-body" : "text-fg-muted"}>{r.map((v, j) => <td key={j} className="whitespace-nowrap px-3 py-1.5 font-mono">{v}</td>)}</tr>)}</tbody></table></div>}
          {c.sample && <Button size="sm" variant="secondary" className="w-fit" icon={<Download />} onClick={() => download(`${c.id}-affected-rows.csv`, toCsv(c.sample!))}>Download affected rows</Button>}
        </div>
      )}
    </li>
  );
}

/** W2-W9: requirements → drop zone → upload → validation progress → report (criteria / preview) → accept (with warning acknowledgement). */
export function DataStep({ k }: { k: Dataset }) {
  const d = useDraft(), f = d.files[k], router = useRouter(), req = REQUIREMENTS[k];
  const [tab, setTab] = useState("criteria");
  const [filter, setFilter] = useState<string>("auto");
  const [openRows, setOpenRows] = useState<string[]>([]);
  const [pending, setPending] = useState<File | null>(null);
  const [vStage, setVStage] = useState(0);
  const later = (["pd", "lgd", "ead"] as Dataset[]).slice((["pd", "lgd", "ead"] as Dataset[]).indexOf(k) + 1).filter((x) => d.files[x].status === "accepted");

  // Validation stages are indicative (the engine reports done/failed); advance slowly while the job runs.
  useEffect(() => {
    if (f.status !== "validating" || vStage >= VALIDATING[k].length - 1) return;
    const t = setTimeout(() => setVStage(vStage + 1), 1500);
    return () => clearTimeout(t);
  }, [f.status, vStage, k]);

  const runValidation = async () => {
    setFile(k, { status: "validating" }); setVStage(0);
    const v = await validate(d.runId!, k);
    if (!v.ok) { setFile(k, { status: "empty" }); toast.error(v.error); return; }
    setFile(k, { status: "report", outcome: v.outcome, criteria: v.criteria, ack: false });
    void hydrate(d.runId!);
  };
  const start = async (file: File) => {
    if (!d.runId) { toast.error("Create the run first."); return; }
    setDraft((x) => ({ files: { ...x.files, [k]: { status: "uploading", name: file.name, sizeMb: +(file.size / 1048576).toFixed(1), progress: 0 }, ...Object.fromEntries(later.map((l) => [l, { ...x.files[l], status: "report" as const, ack: false }])) }, phase: "draft" }));
    setVStage(0); setFilter("auto"); setOpenRows([]);
    const up = await uploadFile(d.runId, k, file, (pct) => setFile(k, { progress: pct }));
    if (!up.ok) { setFile(k, { status: "empty" }); toast.error(up.error); return; }
    await runValidation();
  };
  const proceed = (file: File) => (later.length ? setPending(file) : void start(file));
  // Real files get a browser pre-check first (type, macros, size, header columns); the example buttons skip it.
  const choose = async (file: File) => {
    const id = toast.loading(`Checking ${file.name}…`);
    try {
      const r = await precheckXlsx(file, ECL_REQUIRED[k]);
      if (!r.ok) { toast.error(`${file.name} can't be used`, { id, description: r.errors.slice(0, 3).join(" "), duration: 10_000 }); return; }
      toast.success(`${file.name} looks right`, { id, description: `${r.sheets.filter((s) => s.headers.length).length} sheet(s) with the expected columns. Full validation runs next.` });
    } catch { toast.dismiss(id); /* unreadable in this browser: let the engine decide */ }
    proceed(file);
  };

  const crit: Criterion[] = (f.criteria ?? []).map((c) => ({ ...c }));
  const n = { passed: crit.filter((c) => c.status === "passed").length, warning: crit.filter((c) => c.status === "warning").length, error: crit.filter((c) => c.status === "error").length };
  const view = filter === "auto" ? (n.error ? "error" : n.warning ? "warning" : "all") : filter;
  const list = view === "all" ? crit : crit.filter((c) => c.status === view);
  const [accepting, setAccepting] = useState(false);
  const accept = async () => {
    setAccepting(true);
    const r = await acceptValidation(d.runId!, k);
    setAccepting(false);
    if (!r.ok) { toast.error(r.error); return; }
    setFile(k, { status: "accepted", acceptedAt: new Date().toISOString() }); toast.success(`${NAME[k]} data accepted`); router.push(`/ecl/runs/new/${NEXT[k]}?run=${d.runId}`);
  };

  const footer = f.status === "accepted"
    ? <><Button variant="ghost" asChild icon={<ArrowLeft />}><Link href={`/ecl/runs/new/${PREV[k]}?run=${d.runId ?? ""}`}>Back</Link></Button><Button asChild right={<ArrowRight />}><Link href={`/ecl/runs/new/${NEXT[k]}?run=${d.runId ?? ""}`}>Continue</Link></Button></>
    : f.status === "report" ? (n.error
      ? <><Button variant="secondary" icon={<RefreshCw />} onClick={() => document.getElementById(`replace-${k}`)?.click()}>Upload corrected file</Button><Button disabled disabledReason={`Fix ${n.error} errors to continue`}>Accept {NAME[k]} and continue</Button></>
      : <Button loading={accepting} disabled={n.warning > 0 && !f.ack} disabledReason={n.warning > 0 && !f.ack ? "Acknowledge the warnings first" : undefined} onClick={accept} right={<ArrowRight />}>Accept {NAME[k]} and continue</Button>)
    : f.status === "uploaded" ? <><Button variant="ghost" asChild icon={<ArrowLeft />}><Link href={`/ecl/runs/new/${PREV[k]}?run=${d.runId ?? ""}`}>Back</Link></Button><Button onClick={() => void runValidation()}>Validate {NAME[k]}</Button></>
    : <><Button variant="ghost" asChild icon={<ArrowLeft />}><Link href={`/ecl/runs/new/${PREV[k]}?run=${d.runId ?? ""}`}>Back</Link></Button><Button disabled disabledReason="Upload a file first">Validate {NAME[k]}</Button></>;

  return (
    <WizardShell step={STEP_N[k]} footer={footer} resetMarks={pending ? later.map((l) => STEP_N[l]) : []}>
      <DesktopOnlyNote />
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Requirements k={k} />
        <div className="flex min-w-0 flex-col gap-5">
          {f.status === "empty" ? (
            <>
              <FileDropzone title={`Drop the ${NAME[k]} workbook here`} hint=".xlsx only · up to 50 MB · several months in one or more sheets · macros are rejected" tip={`Tip: ${req.tip}`} onFile={(file) => choose(file)} />
              <p className="text-micro text-fg-muted">No file handy? Download the template on the left, or <Link href="/ecl/sample?run=1" className="text-link hover:underline">try the sample run</Link>.</p>
            </>
          ) : (
            <section className="flex flex-wrap items-center gap-4 rounded-panel border border-line p-4">
              <span className="inline-flex size-10 items-center justify-center rounded-md bg-positive-tint text-positive"><FileSpreadsheet className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-small text-fg">{f.name}</p>
                {f.status === "uploading" ? <ProgressBar value={f.progress ?? 0} label={`Uploading ${f.name}`} className="mt-2" /> : <p className="font-mono text-micro text-fg-muted">{f.sizeMb} MB{f.rows ? ` · ${f.rows.toLocaleString("en-US")} rows` : ""}{f.sha ? ` · SHA ${f.sha.slice(0, 4)}…${f.sha.slice(-3)}` : ""}</p>}
              </div>
              {f.status !== "uploading" && f.status !== "validating" && <>
                <Button size="sm" variant="ghost" icon={<RotateCcw />} onClick={() => document.getElementById(`replace-${k}`)?.click()}>Replace</Button>
                <input id={`replace-${k}`} type="file" accept=".xlsx" className="sr-only" tabIndex={-1} aria-label={`Replace ${NAME[k]} file`} onChange={(e) => { const x = e.target.files?.[0]; if (x) choose(x); e.target.value = ""; }} />
              </>}
            </section>
          )}

          {f.status === "uploaded" && <Banner tone="info" action={<Button size="sm" onClick={() => void runValidation()}>Validate now</Button>}>{f.name} is uploaded. Validate it to see the checks.</Banner>}
          {f.status === "validating" && (
            <section aria-live="polite" className="flex flex-col gap-3 rounded-panel border border-line p-5">
              <p className="text-small text-fg">Validating {NAME[k]} data</p>
              {VALIDATING[k].map((s, i) => <p key={s} className="flex items-center gap-3 text-small">{i < vStage ? <CheckCircle2 className="size-4 text-positive" /> : i === vStage ? <Loader2 className="size-4 text-link motion-safe:animate-spin" /> : <Circle className="size-4 text-fg-subtle" />}<span className={i <= vStage ? "text-fg-body" : "text-fg-muted"}>{s}</span></p>)}
              <p className="flex items-center gap-2 text-micro text-fg-muted"><Info className="size-3.5" />You can leave this page. We&apos;ll keep validating and notify you when it finishes.</p>
            </section>
          )}

          {(f.status === "report" || f.status === "accepted") && f.outcome && !f.criteria && (
            <Banner tone={f.outcome === "failed" ? "negative" : "info"} action={f.status === "report" ? <Button size="sm" variant="secondary" onClick={runValidation}>Show the report</Button> : undefined}>{f.status === "accepted" ? `${NAME[k]} data accepted.` : `${NAME[k]} was validated (${f.outcome}). Reopen the report to accept it.`}</Banner>
          )}
          {(f.status === "report" || f.status === "accepted") && f.outcome && f.criteria && (
            <>
              <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-2 rounded-panel border px-5 py-4", n.error ? "border-negative/40 bg-negative-tint" : "border-warning/40 bg-warning-tint")}>
                <p className="flex-1 text-h4 text-fg">{f.status === "accepted" ? "Accepted" : n.error ? `Cannot continue: fix ${n.error} errors` : n.warning ? "Passed with warnings" : "All checks passed"}</p>
                <Badge tone="positive">{n.passed} passed</Badge><Badge tone="warning">{n.warning} warnings</Badge><Badge tone="negative">{n.error} errors</Badge>
              </div>
              <ToggleGroup label="Report view" value={tab} onChange={setTab} options={[{ value: "criteria", label: "Criteria", count: crit.length }, { value: "preview", label: k === "pd" ? "Data preview" : k === "lgd" ? "Allocation preview" : "Treatment" }]} />
              {tab === "criteria" && (
                <>
                  <ToggleGroup label="Filter criteria" value={view} onChange={setFilter} options={[{ value: "all", label: "All", count: crit.length }, ...(n.error ? [{ value: "error", label: "Errors", count: n.error }] : []), ...(n.warning ? [{ value: "warning", label: "Warnings", count: n.warning }] : []), { value: "passed", label: "Passed", count: n.passed }]} />
                  <ul className="divide-y divide-line rounded-panel border border-line">{list.map((c) => <CriterionRow key={c.id + c.title} c={c} open={openRows.includes(c.id) || (c.status !== "passed" && !openRows.includes(`-${c.id}`) && c === list[0])} onToggle={() => setOpenRows((o) => (o.includes(c.id) ? [...o.filter((x) => x !== c.id), `-${c.id}`] : [...o.filter((x) => x !== `-${c.id}`), c.id]))} />)}</ul>
                  {n.error > 0 && <Banner tone="info">Fix the workbook and upload it again. Your settings and other steps are kept.</Banner>}
                </>
              )}
              {tab === "preview" && <Banner tone="info">Detailed previews (transition matrices, collateral allocation, treatment) are in the validation report download and on the run once computed.</Banner>}
              {f.status === "report" && !n.error && n.warning > 0 && (
                <section className="flex flex-col gap-3 rounded-panel border border-line p-5">
                  <Checkbox checked={Boolean(f.ack)} onCheckedChange={(c) => setFile(k, { ack: c === true })} label={`I've reviewed the ${n.warning} warnings and understand how they affect this run.`} />
                  <Textarea aria-label="Comment for the audit log" maxLength={500} placeholder="Comment for the audit log (optional), for example: missing months are loans sold to Lakeshore MFI in July." value={f.comment ?? ""} onChange={(e) => setFile(k, { comment: e.target.value })} />
                </section>
              )}
            </>
          )}
        </div>
      </div>
      <Modal open={pending !== null} onOpenChange={(v) => !v && setPending(null)} size="md" title={`Replace ${NAME[k]} data?`} icon={<span className="inline-flex size-10 items-center justify-center rounded-full bg-warning-tint text-warning"><AlertTriangle className="size-5" /></span>}
        description={`You've already accepted ${later.map((l) => NAME[l]).join(" and ")}. Replacing the ${NAME[k]} workbook means those steps must be validated again. Your files stay uploaded.`}
        footer={<><Button variant="secondary" onClick={() => setPending(null)}>Keep current file</Button><Button onClick={() => { void start(pending!); setPending(null); }}>Replace and reset {later.length} {later.length === 1 ? "step" : "steps"}</Button></>}>
        <ul className="flex flex-col gap-2 text-small text-fg-body">
          <li className="flex items-center gap-2"><RefreshCw className="size-4 text-fg-muted" />{NAME[k]} validation runs again</li>
          {later.map((l) => <li key={l} className="flex items-center gap-2"><RotateCcw className="size-4 text-fg-muted" />{NAME[l]} acceptance is reset</li>)}
          <li className="flex items-center gap-2"><Info className="size-4 text-fg-muted" />Comments stay in the audit log</li>
        </ul>
      </Modal>
    </WizardShell>
  );
}
