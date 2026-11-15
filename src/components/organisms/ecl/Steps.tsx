"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Loader2, Play, XCircle } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Accordion } from "@/components/molecules/Accordion";
import { Banner } from "@/components/molecules/Banner";
import { ProgressCircle } from "@/components/molecules/Progress";
import { KeyValue } from "@/components/molecules/StatCard";
import { LiveDot } from "@/components/atoms/LiveDot";
import { toast } from "@/components/organisms/Toaster";
import { cn } from "@/lib/cn";
import { date } from "@/lib/format";
import { executeRun } from "@/lib/actions/ecl";
import { hydrate } from "@/lib/wizard-engine";
import { setDraft, useDraft, type Dataset } from "@/hooks/useRunDraft";
import { WizardShell } from "@/components/organisms/ecl/Shell";
import { showCode } from "@/lib/code";

const DS: Dataset[] = ["pd", "lgd", "ead"];

/** W10 review: inputs, acknowledged warnings, settings → Compute ECL (queued on the engine's calc workers). */
export function StepReview() {
  const d = useDraft(), router = useRouter();
  const [busy, start] = useTransition();
  const warnings = DS.flatMap((k) => (d.files[k].criteria ?? []).filter((c) => c.status === "warning").map((c) => ({ k, c, comment: d.files[k].comment })));
  const compute = () => start(async () => {
    const r = await executeRun(d.runId!);
    if (!r.ok) { toast.error(r.error); return; }
    setDraft({ phase: "computing", computeStartedAt: Date.now(), computeAttempt: d.computeAttempt + 1 });
    toast(`Started computing ${d.name}`); router.push(`/ecl/runs/new/compute?run=${d.runId}`);
  });
  return (
    <WizardShell step={5} footer={<><Button variant="ghost" asChild icon={<ArrowLeft />}><Link href={`/ecl/runs/new/ead?run=${d.runId}`}>Back</Link></Button><Button loading={busy} icon={<Play />} onClick={compute}>Compute ECL</Button></>}>
      <div><h2 className="text-h3">Review and compute</h2><p className="text-small text-fg-muted">Nothing is computed until you press Compute ECL. It runs in the background; you can leave this page.</p></div>
      <section className="relative overflow-x-auto rounded-panel border border-line">
        <table className="w-full min-w-[680px] text-small"><caption className="px-5 pt-4 text-left text-h4 text-fg">Inputs</caption>
          <thead><tr className="border-b border-line text-fg-muted">{["File", "Rows", "Hash", "Validation", "Accepted"].map((h) => <th key={h} scope="col" className="px-5 py-2 text-left font-normal">{h}</th>)}</tr></thead>
          <tbody>{DS.map((k) => { const f = d.files[k], w = (f.criteria ?? []).filter((c) => c.status === "warning").length; return (
            <tr key={k} className="border-b border-line last:border-0"><td className="px-5 py-3 text-fg">{f.name ?? "Not uploaded"}</td><td className="px-5 text-fg-body">{f.rows ? f.rows.toLocaleString("en-US") : "No data"}</td><td className="px-5 font-mono text-micro">{f.sha ? `${f.sha.slice(0, 4)}…${f.sha.slice(-3)}` : "No data"}</td><td className="px-5"><Badge tone={f.outcome === "warnings" || w ? "warning" : "positive"}>{f.outcome === "warnings" ? `Passed with ${w || "some"} warning${w === 1 ? "" : "s"}` : "Passed"}</Badge></td><td className="px-5 text-micro text-fg-muted">{f.status === "accepted" ? (f.acceptedAt ? `${date(f.acceptedAt.slice(0, 10))} ${f.acceptedAt.slice(11, 16)}` : "Yes") : "Not yet"}</td></tr>
          ); })}</tbody>
        </table>
      </section>
      {warnings.length > 0 && <Accordion type="single" items={[{ value: "w", title: <span className="text-h4">Acknowledged warnings ({warnings.length})</span>, content: <ul className="flex flex-col gap-2">{warnings.map(({ k, c, comment }) => <li key={k + c.id} className="text-small"><span className="font-mono text-micro text-fg-muted">{showCode(c.id)}</span> {c.title} <span className="text-fg-muted">· {k.toUpperCase()}{comment ? ` · “${comment}”` : ""}</span></li>)}</ul> }]} />}
      <section className="rounded-panel border border-line p-5"><h3 className="mb-4 text-h4">Settings</h3><KeyValue columns={3} items={[["Reporting date", d.reportingDate ? date(d.reportingDate) : "From the EAD file"], ["Currency", d.currency], ["Engine", d.engine]]} /></section>
      <Banner tone="info">This run counts towards your workspace&apos;s monthly run quota once computed. A failed run doesn&apos;t.</Banner>
    </WizardShell>
  );
}

const STAGES = [
  { key: "pd", label: "PD matrices & term structure" },
  { key: "lgd", label: "LGD collateral discounting" },
  { key: "ead", label: "EAD projection" },
  { key: "ecl", label: "ECL, cap and reconciliation" },
] as const;

/** W11/W12 compute: live stage progress from the engine (SSE + polling). Leaving and returning is safe. */
export function StepCompute() {
  const d = useDraft(), router = useRouter();
  const [busy, start] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (d.phase !== "computing" || !d.runId) return;
    const t = setInterval(() => { setNow(Date.now()); void hydrate(d.runId!); }, 4000); // fallback if the event stream drops
    return () => clearInterval(t);
  }, [d.phase, d.runId]);
  const st = (k: string) => d.progress?.[k]?.status ?? "pending";
  const done = STAGES.filter((s) => st(s.key) === "complete").length;
  const pct = d.phase === "computed" || d.phase === "submitted" ? 100 : Math.round((done / STAGES.length) * 100);
  const elapsed = d.computeStartedAt ? Math.max(0, Math.round((now - d.computeStartedAt) / 1000)) : 0;
  const retry = () => start(async () => { const r = await executeRun(d.runId!); if (!r.ok) { toast.error(r.error); return; } setDraft({ phase: "computing", computeStartedAt: Date.now() }); });

  if (d.phase === "draft") return <WizardShell step={6}><Banner tone="info" action={<Button asChild size="sm"><Link href={`/ecl/runs/new/review?run=${d.runId}`}>Go to review</Link></Button>}>Review the inputs and press Compute ECL to start.</Banner></WizardShell>;
  if (d.phase === "compute-failed") return (
    <WizardShell step={6}>
      <section className="flex flex-col gap-6 rounded-panel border border-line p-6 md:p-8">
        <div className="flex items-start gap-4"><span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-negative-tint text-negative"><XCircle className="size-6" /></span>
          <div><h2 className="text-h3">Compute failed</h2><p className="mt-1 text-small text-fg-body">{d.failureMessage ?? "The calculation stopped. Check the inputs and try again."}</p></div></div>
        <ul className="flex flex-col gap-2">{STAGES.map((s) => <li key={s.key} className="flex items-center gap-3 text-small">{st(s.key) === "complete" ? <CheckCircle2 className="size-4 text-positive" /> : st(s.key) === "failed" ? <XCircle className="size-4 text-negative" /> : <Circle className="size-4 text-fg-subtle" />}<span className="flex-1 text-fg-body">{s.label}</span><span className="text-micro capitalize text-fg-muted">{st(s.key)}</span></li>)}</ul>
        <p className="font-mono text-micro text-fg-muted">Run {d.runId}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => router.push(`/ecl/runs/new/pd?run=${d.runId}`)}>Fix inputs</Button>
          <Button variant="secondary" loading={busy} onClick={retry}>Retry compute</Button>
          <Button asChild variant="link"><Link href={`/contact?topic=support&run=${d.runId}`}>Contact support with this run</Link></Button>
        </div>
      </section>
      <Banner tone="info">Your files and acceptances are kept. A failed run does not use quota.</Banner>
    </WizardShell>
  );
  const finished = d.phase !== "computing";
  return (
    <WizardShell step={6} footer={finished ? <Button asChild right={<ArrowRight />}><Link href={`/ecl/runs/${d.runId}/summary`}>Open results &amp; sign off</Link></Button> : undefined}>
      <h2 className="text-h3">{finished ? "ECL computed" : "Computing ECL…"}</h2>
      <section className="grid items-center gap-10 rounded-panel border border-line p-6 md:grid-cols-[auto_1fr] md:p-8">
        <ProgressCircle value={pct} size={200} label="Compute progress"><span className="text-h2 text-fg tabular-nums">{pct} %</span><span className="text-micro text-fg-muted">{finished ? "Done" : STAGES.find((s) => st(s.key) === "running")?.label.split(" ")[0] ?? "Queued"}</span></ProgressCircle>
        <div className="flex flex-col gap-3" aria-live="polite">
          {STAGES.map((s) => { const v = finished ? "complete" : st(s.key); return (
            <p key={s.key} className="flex items-center gap-3 text-small">
              {v === "complete" ? <CheckCircle2 className="size-4 text-positive" /> : v === "running" ? <Loader2 className="size-4 text-link motion-safe:animate-spin" /> : <Circle className="size-4 text-fg-subtle" />}
              <span className={cn("flex-1", v === "pending" ? "text-fg-muted" : "text-fg")}>{s.label}{(s.key === "pd" || s.key === "lgd") && <span className="ml-2 text-micro text-fg-muted">parallel</span>}</span>
              <span className="font-mono text-micro capitalize text-fg-muted">{v === "complete" ? "Done" : v}</span>
            </p>
          ); })}
          {!finished && <p className="border-t border-line pt-3 text-micro text-fg-muted">Elapsed {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</p>}
        </div>
      </section>
      {!finished && <Banner tone="info" action={<Button asChild size="sm" variant="secondary"><Link href="/ecl/runs">Back to runs</Link></Button>}><span className="inline-flex items-center gap-2"><LiveDot tone="info" pulse />You can close this tab. We&apos;ll notify you and your reviewers when it&apos;s done.</span></Banner>}
    </WizardShell>
  );
}

/** W13-W15: review happens on the run itself (maker-checker, engine-enforced); this step hands over to it. */
export function StepSignOff() {
  const d = useDraft(), router = useRouter();
  useEffect(() => { if (d.runId && d.phase !== "draft" && d.phase !== "computing") router.replace(`/ecl/runs/${d.runId}/summary`); }, [d.runId, d.phase, router]);
  return <WizardShell step={7}><Banner tone="info" action={<Button asChild size="sm"><Link href={`/ecl/runs/new/compute?run=${d.runId ?? ""}`}>Go to compute</Link></Button>}>Compute the run before signing off.</Banner></WizardShell>;
}
