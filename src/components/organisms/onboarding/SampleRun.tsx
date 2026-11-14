"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Money } from "@/components/atoms/Numbers";
import { stageDot } from "@/components/atoms/StatusPill";
import { Stepper } from "@/components/molecules/Stepper";
import { ProgressCircle } from "@/components/molecules/Progress";
import { StatCard, HeroMetric } from "@/components/molecules/StatCard";
import { Banner } from "@/components/molecules/Banner";
import { PageHeader } from "@/components/organisms/PageHeader";
import { cn } from "@/lib/cn";
import { markDone, update, useOnboarding } from "@/hooks/useOnboarding";

const STAGES = ["PD", "LGD", "EAD & ECL", "Reconciliation", "Workbooks"];
const SAMPLE = { total: 48210.55, stages: [{ stage: 1 as const, ecl: 8120.4, share: 0.72 }, { stage: 2 as const, ecl: 14390.15, share: 0.2 }, { stage: 3 as const, ecl: 25700, share: 0.08 }] };
const STEP_MS = 1400;

/** O4.2 running → O4.3 done. Sample runs are tagged SAMPLE and never consume trial quota. */
export function SampleRun() {
  const { sampleRun } = useOnboarding();
  const [tick, setTick] = useState(0);
  useEffect(() => { if (sampleRun === "none") update({ sampleRun: "running" }); }, [sampleRun]);
  useEffect(() => {
    if (sampleRun !== "running") return;
    if (tick >= STAGES.length) { update({ sampleRun: "done" }); markDone("ecl-first-run"); return; }
    const t = setTimeout(() => setTick(tick + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [tick, sampleRun]);

  const head = (status: React.ReactNode) => <PageHeader crumbs={[{ label: "Expected Credit Loss", href: "/ecl" }, { label: "Sample — Q1 2026" }]} title="Sample — Q1 2026" status={<><Badge mono tone="info">Sample</Badge>{status}</>} />;

  if (sampleRun !== "done") {
    const pct = Math.round((tick / STAGES.length) * 100);
    return (
      <>
        {head(<Badge tone="info">Computing</Badge>)}
        <Stepper current={5} steps={["Setup", "PD data", "LGD data", "EAD data", "Review", "Compute", "Sign-off"].map((label) => ({ label }))} />
        <section className="grid items-center gap-10 rounded-panel border border-line p-8 md:grid-cols-[auto_1fr]">
          <ProgressCircle value={pct} size={160} label="Sample run progress"><span className="text-h3 text-fg tabular-nums">{pct} %</span><span className="text-micro text-fg-muted">{STAGES[Math.min(tick, 4)]}</span></ProgressCircle>
          <ol aria-live="polite" className="flex flex-col gap-3">
            {STAGES.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-small">
                {i < tick ? <CheckCircle2 aria-label="Done" className="size-4 text-positive" /> : i === tick ? <Loader2 aria-label="Running" className="size-4 text-link motion-safe:animate-spin" /> : <Circle aria-label="Pending" className="size-4 text-fg-subtle" />}
                <span className={i <= tick ? "text-fg" : "text-fg-muted"}>{s}</span>
                <span className="text-micro text-fg-muted">{i < tick ? "Completed" : i === tick ? "Running" : "Pending"}</span>
              </li>
            ))}
          </ol>
        </section>
        <Banner tone="info">Sample runs don&apos;t count against your trial. 60 loans · 3 segments · Jan–Apr 2026.</Banner>
      </>
    );
  }

  return (
    <>
      {head(<Badge tone="positive">Completed</Badge>)}
      <HeroMetric label="Total ECL · 30 Apr 2026" currency="USD" value={<Money value={SAMPLE.total} />} sub="7 / 7 reconciliation checks passed" />
      <div className="grid gap-4 md:grid-cols-3">
        {SAMPLE.stages.map((s) => <StatCard key={s.stage} dot={stageDot[s.stage]} label={`Stage ${s.stage}`} value={<Money value={s.ecl} />} meta={`${(s.share * 100).toFixed(0)} % of exposure`} />)}
      </div>
      <section className="flex flex-wrap items-center gap-4 rounded-panel border border-line bg-raised p-6">
        <div className="flex-1"><p className="text-h4 text-fg">Like what you see?</p><p className="text-small text-fg-muted">Upload your own PD file to run on your portfolio.</p></div>
        <Button asChild right={<ArrowRight />}><Link href="/ecl/runs/new">Upload your own PD file</Link></Button>
        <Button variant="ghost" onClick={() => { update({ sampleRun: "none" }); setTick(0); }}>Run sample again</Button>
      </section>
      <p className={cn("text-micro text-fg-muted")}>Sample results are illustrative and tagged SAMPLE everywhere they appear.</p>
    </>
  );
}

/** O4.1 chooser: sample vs own data. */
export function SampleChooser() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="ring-inner flex flex-col gap-3 rounded-panel border border-line bg-raised p-6">
        <Badge mono tone="info" className="w-fit">Sample</Badge>
        <h3 className="text-h4">Use sample data</h3>
        <p className="flex-1 text-small text-fg-muted">60 loans, 3 segments, Jan–Apr 2026. Doesn&apos;t use a trial run.</p>
        <Button asChild className="w-fit"><Link href="/ecl/sample?run=1">Run sample</Link></Button>
      </div>
      <div className="flex flex-col gap-3 rounded-panel border border-line p-6">
        <Badge className="w-fit">Your data</Badge>
        <h3 className="text-h4">Use my own data</h3>
        <p className="flex-1 text-small text-fg-muted">Download templates, fill them, upload.</p>
        <div className="flex flex-wrap items-center gap-3"><Button asChild variant="secondary"><Link href="/ecl/runs/new">Start a new run</Link></Button><Link href="/ecl/setup/templates" className="text-small text-link hover:underline">Download templates</Link></div>
      </div>
    </div>
  );
}
