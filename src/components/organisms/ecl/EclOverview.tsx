import Link from "next/link";
import { Download } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { LiveDot } from "@/components/atoms/LiveDot";
import { Money, Delta } from "@/components/atoms/Numbers";
import { RunStatusPill, stageDot } from "@/components/atoms/StatusPill";
import { Icon } from "@/components/atoms/Icon";
import { HeroMetric, StatCard } from "@/components/molecules/StatCard";
import { Section } from "@/components/organisms/PageHeader";
import { StateView } from "@/components/organisms/StateView";
import { StackedBars } from "@/components/organisms/StackedBars";
import { SERVICE_PAGES, type LiveServicePage } from "@/data/services";
import { compact, date, percent } from "@/lib/format";
import type { Run, SegmentResult } from "@/types/domain";

const LABEL = { 1: "Performing", 2: "SICR", 3: "Credit impaired" } as const;
type Trend = { month: string; s1: number; s2: number; s3: number }[];

/** E1 populated overview: hero, stage + reconciliation cards, trend, segments, runs in progress, provenance. */
export function EclOverview({ run, trend, segments, inProgress }: { run: Run; trend: Trend; segments: SegmentResult[]; inProgress: Run[] }) {
  const total = segments.reduce((a, s) => a + s.ecl, 0);
  return (
    <>
      <HeroMetric label={`Total ECL · ${run.name} · ${run.signedOffAt ? `signed off ${date(run.signedOffAt.slice(0, 10))}` : "awaiting sign off"}`} currency={run.currency} value={<Money value={run.totalEcl} />} delta={<Delta value={run.deltaVsPrior} suffix=" vs previous run" />} sub={<>Coverage {percent(run.coverage)} · exposure {run.currency} {compact(run.exposure)}</>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {run.stages.map((s) => <StatCard key={s.stage} dot={stageDot[s.stage]} label={`Stage ${s.stage} · ${LABEL[s.stage]}`} value={<Money value={s.ecl} />} meta={<>{percent(s.share, 1)} of exposure · coverage {percent(s.ecl / s.exposure)}</>} />)}
        <StatCard label="Reconciliation" value={`${run.checksPassed} / ${(run as { checksTotal?: number }).checksTotal ?? 7} passed`} meta={<Link href={`/ecl/runs/${run.id}/reconciliation`} className="text-link hover:underline">View checks →</Link>} />
      </div>
      <Section title="Total ECL by stage, last 8 runs">
        <div className="rounded-panel border border-line p-5"><StackedBars title="Total ECL by stage, last 8 runs" data={trend} x="month" format="compact" series={([1, 2, 3] as const).map((n) => ({ key: `s${n}`, label: `Stage ${n}`, color: `var(--stage-${n})`, value: `s${n}` as const }))} /></div>
      </Section>
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Section title="ECL by segment">
          <ul className="flex flex-col gap-4 rounded-panel border border-line p-5">
            {segments.map((s) => (
              <li key={s.segment} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-small"><span className="text-fg">{s.segment}</span><span className="tabular-nums text-fg-body"><Money value={s.ecl} /> <span className="text-fg-muted">· {percent(s.ecl / total, 1)}</span></span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-active"><div className="h-full rounded-full bg-accent" style={{ width: `${(s.ecl / total) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Runs in progress">
          <ul className="flex flex-col divide-y divide-line rounded-panel border border-line">
            {inProgress.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1"><p className="text-small text-fg"><span className="font-mono text-micro text-fg-muted">{r.id}</span> {r.name}</p>
                  {r.step ? <p className="mt-1 flex items-center gap-2 text-micro text-fg-muted"><LiveDot tone="info" pulse />Step {r.step} of 7{r.stepLabel ? ` · ${r.stepLabel}` : ""}</p> : <p className="mt-1 flex items-center gap-2 text-micro text-fg-muted"><Avatar initials={r.createdBy.split(" ").map((p) => p[0]).join("")} size="xs" />Submitted by {r.createdBy}</p>}
                </div>
                <RunStatusPill status={r.status} />
                <Button asChild size="sm" variant={r.status === "needs-review" ? "primary" : "secondary"}><Link href={r.status === "needs-review" ? `/ecl/runs/${r.id}/summary` : r.status === "computing" ? `/ecl/runs/new/compute?run=${r.id}` : `/ecl/runs/new/${["setup", "pd", "lgd", "ead", "review", "compute", "sign-off"][(r.step ?? 1) - 1]}?run=${r.id}`}>{r.status === "needs-review" ? "Review" : "Continue"}</Link></Button>
              </li>
            ))}
          </ul>
        </Section>
      </div>
      <p className="font-mono text-micro text-fg-muted">Figures from {run.name} · engine {run.engine} · <Link href={`/ecl/runs/${run.id}/inputs`} className="hover:underline">inputs</Link></p>
    </>
  );
}

/** E2 empty overview: guidance, what you'll need (with templates), ghost dashboard preview. */
export function EclOverviewEmpty() {
  const files = (SERVICE_PAGES.ecl as LiveServicePage).inputs;
  const blurb: Record<string, string> = { "PD workbook": "Monthly staging snapshots", "LGD workbook": "Customer collateral", "EAD workbook": "Loan exposures" };
  return (
    <>
      <StateView icon="ecl" title="No ECL runs yet" description="Upload PD, LGD and EAD workbooks to compute your first provision."
        action={<Button asChild icon={<Icon name="plus" />}><Link href="/ecl/runs/new">New run</Link></Button>}
        secondary={<><Button asChild variant="secondary"><Link href="/ecl/sample?run=1">Try with sample data</Link></Button><Button asChild variant="link"><Link href="/ecl/setup/templates">Download templates</Link></Button></>} />
      <Section title="What you'll need">
        <div className="grid gap-4 md:grid-cols-3">
          {files.map((f) => (
            <div key={f.name} className="flex flex-col gap-3 rounded-panel border border-line p-5">
              <p className="text-small text-fg">{f.name.replace(" workbook", "")} <span className="text-fg-muted">· {blurb[f.name]}</span></p>
              <ul className="flex flex-col gap-1">{f.columns.filter((c) => c.required).slice(0, 4).map((c) => <li key={c.name} className="font-mono text-micro text-fg-body">{c.name}</li>)}</ul>
              <a href={f.template} download className="mt-auto inline-flex items-center gap-1.5 text-small text-link hover:underline"><Download aria-hidden className="size-4" />Template</a>
            </div>
          ))}
        </div>
      </Section>
      <div aria-hidden className="grid gap-4 opacity-30 md:grid-cols-[2fr_1fr]"><div className="skeleton h-56 rounded-panel" /><div className="skeleton h-56 rounded-panel" /></div>
    </>
  );
}
