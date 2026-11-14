"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, Download, Info, Loader2, Lock, Play, Send, XCircle } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { LiveDot } from "@/components/atoms/LiveDot";
import { Money, Delta } from "@/components/atoms/Numbers";
import { stageDot } from "@/components/atoms/StatusPill";
import { Banner } from "@/components/molecules/Banner";
import { ProgressBar, ProgressCircle } from "@/components/molecules/Progress";
import { HeroMetric, KeyValue, StatCard } from "@/components/molecules/StatCard";
import { Accordion } from "@/components/molecules/Accordion";
import { ConfirmDialog } from "@/components/organisms/Modal";
import { toast } from "@/components/organisms/Toaster";
import { Waterfall } from "@/components/organisms/Waterfall";
import { cn } from "@/lib/cn";
import { compact, date, percent } from "@/lib/format";
import { entitlement, quotaLeft } from "@/lib/entitlements";
import { getWorkspace } from "@/data/mock/index";
import { CRITERIA, REQUIREMENTS, RESULT } from "@/data/wizard";
import { NEW_DRAFT, resetDraft, setDraft, useDraft, type Dataset } from "@/hooks/useRunDraft";
import { WizardShell } from "@/components/organisms/ecl/Shell";

const DS: Dataset[] = ["pd", "lgd", "ead"];
const ME = "Eric Uwase";

/** W10 review: inputs, acknowledged warnings, settings, scope, quota impact → Compute ECL. */
export function StepReview() {
  const d = useDraft(), router = useRouter();
  const q = entitlement(getWorkspace(), "ecl");
  const left = quotaLeft(q);
  const warnings = DS.flatMap((k) => (d.files[k].outcome ? CRITERIA[k][d.files[k].outcome!].filter((c) => c.status === "warning").map((c) => ({ k, c, comment: d.files[k].comment })) : []));
  const compute = () => { setDraft({ phase: "computing", computeStartedAt: Date.now(), computeAttempt: d.computeAttempt + 1 }); toast(`Started computing ${d.id}`); router.push("/ecl/runs/new/compute"); };
  return (
    <WizardShell step={5} footer={<><Button variant="ghost" asChild icon={<ArrowLeft />}><Link href="/ecl/runs/new/ead">Back</Link></Button><Button icon={<Play />} onClick={compute}>Compute ECL</Button></>}>
      <div><h2 className="text-h3">Review and compute</h2><p className="text-small text-fg-muted">Nothing is computed until you press Compute ECL.</p></div>
      <section className="relative overflow-x-auto rounded-panel border border-line">
        <table className="w-full min-w-[680px] text-small"><caption className="px-5 pt-4 text-left text-h4 text-fg">Inputs</caption>
          <thead><tr className="border-b border-line text-fg-muted">{["File", "Rows", "Hash", "Validation", "Accepted"].map((h) => <th key={h} scope="col" className="px-5 py-2 text-left font-normal">{h}</th>)}</tr></thead>
          <tbody>{DS.map((k) => { const f = d.files[k], r = REQUIREMENTS[k], w = f.outcome ? CRITERIA[k][f.outcome].filter((c) => c.status === "warning").length : 0; return (
            <tr key={k} className="border-b border-line last:border-0"><td className="px-5 py-3 text-fg">{f.name}</td><td className="px-5 text-fg-body">{r.rows.split(" · ").pop()}</td><td className="px-5 font-mono text-micro">{r.sha}</td><td className="px-5"><Badge tone={w ? "warning" : "positive"}>{w ? `Passed with ${w} warning${w > 1 ? "s" : ""}` : "Passed"}</Badge></td><td className="px-5 text-micro text-fg-muted">{ME} · {f.acceptedAt ? f.acceptedAt.slice(11, 16) : "—"}</td></tr>
          ); })}</tbody>
        </table>
      </section>
      {warnings.length > 0 && <Accordion type="single" items={[{ value: "w", title: <span className="text-h4">Acknowledged warnings ({warnings.length})</span>, content: <ul className="flex flex-col gap-2">{warnings.map(({ k, c, comment }) => <li key={c.id} className="text-small"><span className="font-mono text-micro text-fg-muted">{c.id}</span> {c.title} <span className="text-fg-muted">· {k.toUpperCase()}{comment ? ` · “${comment}”` : ""}</span></li>)}</ul> }]} />}
      <section className="rounded-panel border border-line p-5"><h3 className="mb-4 text-h4">Settings</h3><KeyValue columns={4} items={[["Reporting date", date(d.reportingDate)], ["Currency", d.currency], ["Engine", d.engine], ["Segments", "4"], ["Collateral types", "5"], ["Thresholds", "Default"]]} /></section>
      <section className="rounded-panel border border-line p-5"><h3 className="text-h4">Expected scope</h3><p className="mt-2 text-small text-fg-body">48,312 loans · USD 556.1M exposure · 18 loans excluded</p></section>
      {d.sample ? <Banner tone="info">Sample runs don&apos;t use your quota and can&apos;t be signed off.</Banner> : (
        <section className="flex flex-wrap items-center gap-4 rounded-panel border border-warning/40 bg-warning-tint p-5">
          <Info aria-hidden className="size-5 text-warning" />
          <p className="flex-1 text-small text-fg">{left <= 1 ? "This is your last run in the current quota. Existing runs stay available afterwards." : `This run uses 1 of your ${left} remaining runs (${q.quota?.unit}).`}</p>
          {q.quota && <div className="w-40"><ProgressBar value={q.quota.used + 1} max={q.quota.limit} label="Runs after this one" /></div>}
        </section>
      )}
    </WizardShell>
  );
}

const STAGES = [
  { key: "pd", label: "PD matrices & term structure", at: [0, 0.3] },
  { key: "lgd", label: "LGD collateral discounting", at: [0, 0.22] },
  { key: "ead", label: "EAD projection & ECL", at: [0.3, 0.75] },
  { key: "rec", label: "Reconciliation checks", at: [0.75, 0.88] },
  { key: "out", label: "Output workbooks", at: [0.88, 1] },
];
const DURATION = 9000;

/** W11/W12 compute: parallel PD+LGD, then EAD/ECL, reconciliation, workbooks. Progress derives from start time, so leaving and returning is safe. `?fail=1` demonstrates the failure terminal. */
export function StepCompute() {
  const d = useDraft(), router = useRouter(), sp = useSearchParams();
  const [now, setNow] = useState(() => Date.now());
  const failing = sp.get("fail") === "1" && d.computeAttempt <= 1;
  const p = d.phase === "computing" && d.computeStartedAt ? Math.min(1, (now - d.computeStartedAt) / DURATION) : d.phase === "compute-failed" ? 0.42 : d.phase === "draft" ? 0 : 1;
  useEffect(() => {
    if (d.phase !== "computing") return;
    if (failing && p >= 0.42) { setDraft({ phase: "compute-failed" }); return; }
    if (p >= 1) { setDraft({ phase: "computed" }); toast.success(`${d.id} computed`, { description: "Ready for sign-off." }); return; }
    const t = setTimeout(() => setNow(Date.now()), 250);
    return () => clearTimeout(t);
  }, [d.phase, d.id, p, now, failing]);

  const elapsed = d.computeStartedAt ? Math.round(((d.phase === "computing" ? now : d.computeStartedAt + DURATION * p) - d.computeStartedAt) / 1000) : 0;
  const state = (s: (typeof STAGES)[number]) => (d.phase === "compute-failed" && s.key === "ead" ? "failed" : p >= s.at[1] ? "done" : p >= s.at[0] ? (d.phase === "compute-failed" ? "not run" : "running") : d.phase === "compute-failed" ? "not run" : "pending");

  if (d.phase === "draft") return <WizardShell step={6}><Banner tone="info" action={<Button asChild size="sm"><Link href="/ecl/runs/new/review">Go to review</Link></Button>}>Review the inputs and press Compute ECL to start.</Banner></WizardShell>;
  if (d.phase === "compute-failed") return (
    <WizardShell step={6}>
      <section className="flex flex-col gap-6 rounded-panel border border-line p-6 md:p-8">
        <div className="flex items-start gap-4"><span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-negative-tint text-negative"><XCircle className="size-6" /></span>
          <div><h2 className="text-h3">Compute failed at EAD &amp; ECL</h2><p className="mt-1 text-small text-fg-body">No PD curve matched 1,204 loans in segment “Leasing”. This segment exists in the EAD file but not in the PD file.</p></div></div>
        <ul className="flex flex-col gap-2">{STAGES.map((s) => { const st = state(s); return <li key={s.key} className="flex items-center gap-3 text-small">{st === "done" ? <CheckCircle2 className="size-4 text-positive" /> : st === "failed" ? <XCircle className="size-4 text-negative" /> : <Circle className="size-4 text-fg-subtle" />}<span className="flex-1 text-fg-body">{s.label}</span><span className="text-micro text-fg-muted">{st === "done" ? "Completed" : st === "failed" ? "Failed at 01:05" : "Not run"}</span></li>; })}</ul>
        <p className="font-mono text-micro text-fg-muted">Ref job_01HF7K…9Q · {d.id}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => { setDraft((x) => ({ phase: "draft", files: { ...x.files, pd: { ...x.files.pd, status: "report" } } })); router.push("/ecl/runs/new/pd"); }}>Fix inputs</Button>
          <Button variant="secondary" onClick={() => { setDraft({ phase: "computing", computeStartedAt: Date.now(), computeAttempt: d.computeAttempt + 1 }); router.replace("/ecl/runs/new/compute"); }}>Retry compute</Button>
          <Button asChild variant="link"><Link href={`/contact?topic=support&ref=job_01HF7K9Q&run=${d.id}`}>Contact support with this reference</Link></Button>
        </div>
      </section>
      <Banner tone="info">Your files and acceptances are kept. A failed run does not use trial quota.</Banner>
    </WizardShell>
  );
  return (
    <WizardShell step={6} footer={d.phase === "computed" ? <Button asChild><Link href="/ecl/runs/new/sign-off">Continue to sign-off</Link></Button> : undefined}>
      <h2 className="text-h3">{d.phase === "computing" ? "Computing ECL…" : "ECL computed"}</h2>
      <section className="grid items-center gap-10 rounded-panel border border-line p-6 md:grid-cols-[auto_1fr] md:p-8">
        <ProgressCircle value={Math.round(p * 100)} size={200} label="Compute progress"><span className="text-h2 text-fg tabular-nums">{Math.round(p * 100)} %</span><span className="text-micro text-fg-muted">{STAGES.find((s) => state(s) === "running")?.label.split(" ")[0] ?? (p >= 1 ? "Done" : "")}</span></ProgressCircle>
        <div className="flex flex-col gap-3" aria-live="polite">
          {STAGES.map((s) => { const st = state(s); return (
            <p key={s.key} className="flex items-center gap-3 text-small">
              {st === "done" ? <CheckCircle2 className="size-4 text-positive" /> : st === "running" ? <Loader2 className="size-4 text-link motion-safe:animate-spin" /> : <Circle className="size-4 text-fg-subtle" />}
              <span className={cn("flex-1", st === "pending" ? "text-fg-muted" : "text-fg")}>{s.label}{(s.key === "pd" || s.key === "lgd") && <span className="ml-2 text-micro text-fg-muted">parallel</span>}</span>
              <span className="font-mono text-micro text-fg-muted">{st === "running" && s.key === "ead" ? `${Math.round(Math.min(1, (p - 0.3) / 0.45) * 48312).toLocaleString("en-US")} of 48,312 loans` : st === "done" ? "Done" : st === "running" ? "Running" : "Pending"}</span>
            </p>
          ); })}
          <p className="border-t border-line pt-3 text-micro text-fg-muted">Elapsed {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")} · usually 4–6 minutes for this size</p>
        </div>
      </section>
      {d.phase === "computing" && <Banner tone="info" action={<Button asChild size="sm" variant="secondary"><Link href="/ecl/runs">Back to runs</Link></Button>}><span className="inline-flex items-center gap-2"><LiveDot tone="info" pulse />You can close this tab. We&apos;ll notify you and {d.reviewer} (Reviewer) when it&apos;s done.</span></Banner>}
    </WizardShell>
  );
}

function Results({ withMovement }: { withMovement?: boolean }) {
  return (
    <>
      <HeroMetric label="Total ECL · 30 Nov 2026" currency="USD" value={<Money value={RESULT.total} />} delta={<Delta value={RESULT.delta} suffix={` vs Q3 (${RESULT.vs})`} />} sub={<>Coverage {percent(RESULT.coverage)} of USD {compact(RESULT.exposure)} exposure</>} />
      <div className="grid gap-4 md:grid-cols-3">{RESULT.stages.map((s) => <StatCard key={s.stage} dot={stageDot[s.stage]} label={`Stage ${s.stage}`} value={<Money value={s.ecl} />} meta={`${percent(s.share, 1)} of exposure`} />)}</div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-panel border border-line p-5"><h3 className="mb-3 flex items-center gap-2 text-h4"><CheckCircle2 className="size-5 text-positive" />7 of 7 checks passed</h3><ul className="grid gap-1.5 sm:grid-cols-2">{RESULT.checks.map((c) => <li key={c} className="flex items-center gap-2 text-small text-fg-body"><CheckCircle2 aria-hidden className="size-3.5 text-positive" />{c}</li>)}</ul></section>
        <section className="rounded-panel border border-line p-5"><h3 className="mb-3 text-h4">64 exceptions</h3><ul className="flex flex-col gap-2">{RESULT.exceptions.map(([c, n]) => <li key={c} className="flex items-center gap-3 text-small"><span className="w-32 text-fg-body">{c}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-active"><span className="block h-full bg-accent" style={{ width: `${(n / 46) * 100}%` }} /></span><span className="w-8 text-right tabular-nums text-fg">{n}</span></li>)}</ul></section>
      </div>
      {withMovement && <section className="rounded-panel border border-line p-5"><h3 className="mb-3 text-h4">What changed vs Q3</h3><Waterfall title="ECL movement Q3 to Nov" steps={RESULT.movement} /></section>}
    </>
  );
}

/** W13–W15 sign-off: analyst submits → reviewer approves or returns → returned / signed-off states. Maker-checker: you can't approve your own run. */
export function StepSignOff() {
  const d = useDraft(), router = useRouter(), sp = useSearchParams();
  const asReviewer = sp.get("as") === "reviewer";
  const [reviewed, setReviewed] = useState(false);
  const [decision, setDecision] = useState("");
  const [checks, setChecks] = useState([false, false, false]);
  if (d.phase === "draft" || d.phase === "computing" || d.phase === "compute-failed") return <WizardShell step={7}><Banner tone="info" action={<Button asChild size="sm"><Link href="/ecl/runs/new/compute">Go to compute</Link></Button>}>Compute the run before signing off.</Banner></WizardShell>;

  if (d.phase === "signed-off") return (
    <WizardShell step={7}>
      <section className="flex flex-wrap items-center gap-5 rounded-panel border border-positive/40 bg-positive-tint p-6">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-positive text-fg-inverse"><Lock className="size-5" /></span>
        <div className="flex-1"><p className="text-h4 text-fg">Signed off by {d.reviewer} · {date(new Date().toISOString().slice(0, 10))}</p><p className="font-mono text-micro text-fg-body">Engine {d.engine} · Inputs SHA 9f2c…a71 / 41ad…07c / c7e0…5b2</p><p className="mt-1 text-micro text-fg-muted">This run is locked.</p></div>
      </section>
      <div className="flex flex-wrap gap-2">
        <Button icon={<Download />} onClick={() => toast.success("Bundle download started")}>Download bundle</Button>
        <Button asChild variant="secondary"><Link href="/ecl/compare?a=RUN-0142&b=RUN-0144">Compare with…</Link></Button>
        <Button variant="secondary" onClick={() => { resetDraft({ ...NEW_DRAFT(), id: "RUN-0145", name: `${d.name} (v2)`, files: d.files, reportingDate: d.reportingDate }); toast("New version created", { description: "Linked to the signed-off run." }); router.push("/ecl/runs/new/review"); }}>Rerun as new version</Button>
      </div>
      <Results />
    </WizardShell>
  );

  if (d.phase === "returned") return (
    <WizardShell step={7}>
      <Banner tone="warning">{d.reviewer} returned this run · {date(new Date().toISOString().slice(0, 10))}</Banner>
      <section className="flex flex-col gap-3 rounded-panel border border-line p-5">
        <p className="flex items-center gap-2 text-small text-fg"><Avatar initials="JH" size="sm" />{d.reviewer} <span className="text-micro text-fg-muted">Reviewer</span></p>
        <blockquote className="text-small text-fg-body">“{d.returnComment}”</blockquote>
        <div className="flex gap-2"><Button size="sm" onClick={() => { setDraft({ phase: "draft" }); router.push("/ecl/runs/new/ead"); }}>Reopen as draft</Button><Button size="sm" variant="secondary" onClick={() => { setDraft({ phase: "submitted" }); toast.success("Reply sent and run resubmitted"); }}>Reply and resubmit</Button></div>
      </section>
      <Results />
    </WizardShell>
  );

  if (d.phase === "submitted" && asReviewer) return (
    <WizardShell step={7}>
      <Banner tone="info">{ME} submitted this run for your review{d.note ? ` · “${d.note}”` : ""}</Banner>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6"><Results withMovement /></div>
        <aside className="flex h-fit flex-col gap-4 rounded-panel border border-line p-5 lg:sticky lg:top-24">
          <h3 className="text-h4">Your decision</h3>
          {["Reconciliation reviewed", "Exceptions reviewed", "Methodology unchanged"].map((c, i) => <Checkbox key={c} checked={checks[i]} onCheckedChange={(v) => setChecks((x) => x.map((y, j) => (j === i ? v === true : y)))} label={c} />)}
          <Textarea aria-label="Comment" maxLength={1000} placeholder="Comment (required to return)" value={decision} onChange={(e) => setDecision(e.target.value)} />
          <Button disabled={!checks.every(Boolean)} disabledReason={!checks.every(Boolean) ? "Tick all three checks to approve" : undefined} onClick={() => { setDraft({ phase: "signed-off" }); toast.success(`${d.id} signed off`); router.replace("/ecl/runs/new/sign-off"); }}>Approve &amp; sign off</Button>
          <Button variant="secondary" disabled={decision.trim().length < 5} disabledReason={decision.trim().length < 5 ? "Add a comment explaining what to change" : undefined} onClick={() => { setDraft({ phase: "returned", returnComment: decision.trim() }); toast("Run returned to Eric Uwase"); router.replace("/ecl/runs/new/sign-off"); }}>Return with comments</Button>
          <p className="flex items-start gap-2 text-micro text-fg-muted"><Info className="mt-0.5 size-3.5 shrink-0" />Signed-off runs are locked. Changes require a rerun.</p>
        </aside>
      </div>
    </WizardShell>
  );

  if (d.phase === "submitted") return (
    <WizardShell step={7}>
      <Banner tone="info" action={<Button asChild size="sm" variant="secondary"><Link href="/ecl/runs/new/sign-off?as=reviewer">Preview as reviewer</Link></Button>}>Submitted to {d.reviewer}. The run is locked while it&apos;s reviewed.</Banner>
      <Results />
    </WizardShell>
  );

  return (
    <WizardShell step={7}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">{d.sample ? <Banner tone="info">Sample run — results are illustrative and can&apos;t be submitted for sign-off.</Banner> : null}<Results /></div>
        <aside className="flex h-fit flex-col gap-4 rounded-panel border border-line p-5 lg:sticky lg:top-24">
          <h3 className="text-h4">Submit for review</h3>
          <label className="flex flex-col gap-1.5 text-small text-fg-body">Reviewer<Select value={d.reviewer} onChange={(e) => setDraft({ reviewer: e.target.value })}><option>Jean Habimana</option><option>Aline Mugisha</option></Select></label>
          <label className="flex flex-col gap-1.5 text-small text-fg-body">Note<Textarea maxLength={500} value={d.note} onChange={(e) => setDraft({ note: e.target.value })} placeholder="Provision up 2.0 % — driven by SME Stage 2 migration." /></label>
          <Checkbox checked={reviewed} onCheckedChange={(v) => setReviewed(v === true)} label="I have reviewed the exceptions" />
          <ConfirmDialog danger={false} title={`Submit ${d.id}?`} description="The run will be locked while it's reviewed." confirmLabel="Submit" onConfirm={() => { setDraft({ phase: "submitted" }); toast.success(`Submitted to ${d.reviewer}`); }}
            trigger={<Button icon={<Send />} disabled={!reviewed || d.sample} disabledReason={d.sample ? "Sample runs can't be signed off" : !reviewed ? "Confirm you reviewed the exceptions" : undefined}>Submit for review</Button>} />
          <p className="text-micro text-fg-muted">You can&apos;t approve your own run.</p>
        </aside>
      </div>
    </WizardShell>
  );
}
