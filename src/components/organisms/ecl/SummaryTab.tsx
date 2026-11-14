import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Money, Delta, Percent } from "@/components/atoms/Numbers";
import { stageDot } from "@/components/atoms/StatusPill";
import { HeroMetric, StatCard } from "@/components/molecules/StatCard";
import { Section } from "@/components/organisms/PageHeader";
import { StageDonut } from "@/components/organisms/StageDonut";
import { compact, date, percent } from "@/lib/format";
import { exceptionCounts, migration } from "@/data/mock/results";
import type { Run, SegmentResult } from "@/types/domain";
import { SignOffBar } from "@/components/organisms/ecl/SignOffBar";

/** R1 summary. */
export function SummaryTab({ run, segments }: { run: Run; segments: SegmentResult[] }) {
  if (!run.totalEcl) return <p className="rounded-panel border border-line p-6 text-small text-fg-muted">This run hasn&apos;t been computed yet. <Link href="/ecl/runs/new/review" className="text-link hover:underline">Continue the run →</Link></p>;
  const tot = segments.reduce((a, s) => ({ e: a.e + s.exposure, l: a.l + s.ecl }), { e: 0, l: 0 });
  return (
    <>
      <HeroMetric label={`Total ECL · ${date(run.reportingDate)}`} currency="USD" value={<Money value={run.totalEcl} />} delta={<Delta value={run.deltaVsPrior} suffix=" vs Aug" />} sub={<>Coverage {percent(run.coverage)} of USD {compact(run.exposure)}</>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {run.stages.map((s) => <StatCard key={s.stage} dot={stageDot[s.stage]} label={`Stage ${s.stage}`} value={<Money value={s.ecl} />} meta={<>{percent(s.share, 1)} of exposure · coverage {percent(s.ecl / s.exposure)}</>} />)}
        <StatCard label="Reconciliation" value={`${run.checksPassed} / 7 passed`} meta={<Link href={`/ecl/runs/${run.id}/reconciliation`} className="text-link hover:underline">View checks →</Link>} />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Section title="ECL by segment">
          <div className="relative overflow-x-auto rounded-panel border border-line">
            <table className="w-full min-w-[540px] text-small tabular-nums"><caption className="sr-only">ECL by segment</caption>
              <thead><tr className="border-b border-line text-fg-muted">{["Segment", "Exposure · USD", "ECL · USD", "Coverage", "Δ vs Aug"].map((h, i) => <th key={h} scope="col" className={`px-4 py-2 font-normal ${i ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
              <tbody>
                {segments.map((s) => <tr key={s.segment} className="border-b border-line"><th scope="row" className="px-4 py-2.5 text-left font-normal"><Link href={`/ecl/results?segment=${s.segment}`} className="text-fg hover:underline">{s.segment}</Link></th><td className="px-4 text-right">{compact(s.exposure)}</td><td className="px-4 text-right"><Money value={s.ecl} /></td><td className="px-4 text-right"><Percent value={s.coverage} /></td><td className="px-4 text-right"><Delta value={s.delta} /></td></tr>)}
                <tr><th scope="row" className="px-4 py-2.5 text-left font-medium text-fg">Total</th><td className="px-4 text-right text-fg">{compact(tot.e)}</td><td className="px-4 text-right text-fg"><Money value={tot.l} /></td><td className="px-4 text-right text-fg"><Percent value={tot.l / tot.e} /></td><td className="px-4 text-right"><Delta value={run.deltaVsPrior} /></td></tr>
              </tbody>
            </table>
          </div>
        </Section>
        <Section title="Stage movement since Aug">
          <div className="flex flex-col items-center gap-5 rounded-panel border border-line p-5 sm:flex-row lg:flex-col xl:flex-row">
            <StageDonut size={140} shares={run.stages.map((s) => s.share) as [number, number, number]} center={<><span className="text-h4 text-fg">{compact(run.totalEcl)}</span><span className="text-micro text-fg-muted">Total ECL</span></>} />
            <table className="text-micro tabular-nums"><caption className="sr-only">Loans moving between stages since August</caption>
              <thead><tr><td /><th scope="col" className="px-2 font-normal text-fg-muted">S1</th><th scope="col" className="px-2 font-normal text-fg-muted">S2</th><th scope="col" className="px-2 font-normal text-fg-muted">S3</th></tr></thead>
              <tbody>{migration.map((r, i) => <tr key={i}><th scope="row" className="pr-2 text-left font-normal text-fg-muted">S{i + 1}</th>{r.map((v, j) => <td key={j} className={`px-2 py-1 text-right ${i === j ? "text-fg" : "text-fg-body"}`}>{v.toLocaleString("en-US")}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </Section>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {run.status === "signed-off" ? <div className="flex items-center gap-4 rounded-panel border border-positive/40 bg-positive-tint p-5"><Lock aria-hidden className="size-5 text-positive" /><p className="text-small text-fg">Signed off {run.signedOffAt && date(run.signedOffAt.slice(0, 10))} by {run.reviewer}<span className="block text-micro text-fg-body">Inputs and results are locked.</span></p></div>
          : <div className="flex items-center gap-4 rounded-panel border border-line p-5"><CheckCircle2 aria-hidden className="size-5 text-fg-muted" /><p className="text-small text-fg">Not signed off yet</p></div>}
        <Link href={`/ecl/runs/${run.id}/exceptions`} className="flex items-center gap-4 rounded-panel border border-line p-5 hover:border-line-strong"><p className="flex-1 text-small text-fg">Exceptions {run.exceptions}<span className="block text-micro text-fg-muted">{Object.entries(exceptionCounts).map(([k, v]) => `${k} ${v}`).join(" · ")}</span></p><ArrowRight className="size-4 text-fg-muted" /></Link>
      </div>
      {run.status === "needs-review" && <SignOffBar id={run.id} preparer={run.createdBy} />}
    </>
  );
}
