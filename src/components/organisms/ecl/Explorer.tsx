import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Money, PD } from "@/components/atoms/Numbers";
import { StagePill, stageDot } from "@/components/atoms/StatusPill";
import { Breadcrumb } from "@/components/molecules/Breadcrumb";
import { HeroMetric, KeyValue, StatCard } from "@/components/molecules/StatCard";
import { Section } from "@/components/organisms/PageHeader";
import { StackedBars } from "@/components/organisms/StackedBars";
import { TimeSeries } from "@/components/organisms/TimeSeries";
import { Waterfall } from "@/components/organisms/Waterfall";
import { TERM } from "@/data/wizard";
import { compact, money, percent } from "@/lib/format";
import { loanSchedule, loans, sizeBuckets, TOTAL_LOANS } from "@/data/mock/results";
import type { Run, SegmentResult } from "@/types/domain";
import { CopyLink, ExportMenu } from "@/components/organisms/ecl/ExplorerActions";

const base = (runId: string) => `/ecl/results?run=${runId}`;

/** R10 portfolio view. */
export function Portfolio({ run, segments }: { run: Run; segments: SegmentResult[] }) {
  const top = [...loans].sort((a, b) => b.ecl - a.ecl).slice(0, 10);
  return (
    <>
      <div className="flex flex-wrap items-center gap-3"><Breadcrumb items={[{ label: "Portfolio" }]} /><span className="ml-auto"><ExportMenu name={`${run.id}-portfolio`} rows={[["Segment", "Exposure", "ECL", "Coverage"], ...segments.map((s) => [s.segment, s.exposure, s.ecl, s.coverage])]} /></span></div>
      <HeroMetric label="Total ECL" currency="USD" value={<Money value={run.totalEcl} />} sub={`${TOTAL_LOANS.toLocaleString("en-US")} loans · coverage ${percent(run.coverage)}`} />
      <div className="grid gap-4 md:grid-cols-3">{run.stages.map((s) => <StatCard key={s.stage} dot={stageDot[s.stage]} label={`Stage ${s.stage}`} value={`USD ${compact(s.ecl)}`} meta={`${percent(s.ecl / run.totalEcl, 1)} of total ECL`} />)}</div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="ECL by segment">
          <ul className="divide-y divide-line rounded-panel border border-line">{segments.map((s) => (
            <li key={s.segment}><Link href={`${base(run.id)}&segment=${s.segment}`} className="flex items-center gap-4 px-5 py-3 hover:bg-surface/60"><span className="w-24 text-small text-fg">{s.segment}</span><span className="flex-1 text-right text-small tabular-nums"><Money value={s.ecl} /></span><span className="w-16 text-right text-micro text-fg-muted">{percent(s.coverage)}</span><ArrowRight aria-hidden className="size-4 text-fg-muted" /></Link></li>
          ))}</ul>
        </Section>
        <Section title="ECL distribution by loan size"><div className="rounded-panel border border-line p-5"><StackedBars title="ECL by loan size" data={sizeBuckets} x="bucket" format="compact" height={180} series={[{ key: "ecl", label: "ECL", color: "var(--chart-1)", value: "ecl" }]} /></div></Section>
      </div>
      <Section title="Top 10 loans by ECL">
        <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[520px] text-small tabular-nums"><caption className="sr-only">Top 10 loans by ECL</caption>
          <thead><tr className="border-b border-line text-fg-muted">{["Loan", "Segment", "Stage", "ECL · USD", "Coverage"].map((h, i) => <th key={h} scope="col" className={`px-4 py-2 font-normal ${i > 2 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
          <tbody>{top.map((l) => <tr key={l.id} className="border-b border-line last:border-0"><td className="px-4 py-2.5"><Link href={`${base(run.id)}&segment=${l.segment}&loan=${l.id}`} className="font-mono text-micro text-fg hover:underline">{l.id}</Link></td><td className="px-4 text-fg-body">{l.segment}</td><td className="px-4"><StagePill stage={l.stage} /></td><td className="px-4 text-right"><Money value={l.ecl} /></td><td className="px-4 text-right text-fg-muted">{percent(l.ecl / l.ead)}</td></tr>)}</tbody>
        </table></div>
      </Section>
    </>
  );
}

/** R11 segment view. */
export function SegmentView({ run, seg, segments }: { run: Run; seg: SegmentResult; segments: SegmentResult[] }) {
  const contributors = loans.filter((l) => l.segment === seg.segment).sort((a, b) => b.ecl - a.ecl);
  const split = { Retail: [0.74, 0.2, 0.06], SME: [0.527, 0.314, 0.159], Corporate: [0.81, 0.15, 0.04], Mortgage: [0.88, 0.1, 0.02] }[seg.segment] ?? [0.7, 0.2, 0.1];
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Breadcrumb items={[{ label: "Portfolio", href: base(run.id) }, { label: seg.segment }]} />
        <span className="flex flex-wrap gap-1">{segments.map((s) => <Link key={s.segment} href={`${base(run.id)}&segment=${s.segment}`} aria-current={s.segment === seg.segment ? "page" : undefined} className={`rounded-full px-3 py-1 text-micro ${s.segment === seg.segment ? "bg-surface-active text-fg" : "text-fg-muted hover:text-fg"}`}>{s.segment}</Link>)}</span>
        <span className="ml-auto"><ExportMenu name={`${run.id}-${seg.segment}`} rows={[["Loan", "Stage", "ECL"], ...contributors.map((l) => [l.id, l.stage, l.ecl])]} /></span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Exposure · USD" value={compact(seg.exposure)} /><StatCard label="ECL · USD" value={money(seg.ecl)} /><StatCard label="Coverage" value={percent(seg.coverage)} /><StatCard label="Loans" value={{ Retail: "31,204", SME: "9,880", Corporate: "1,012", Mortgage: "6,216" }[seg.segment] ?? "—"} /><StatCard label="Cure rate" value={seg.segment === "SME" ? "0.0611" : "0.0808"} />
      </div>
      <Section title="Stage split">
        <div role="img" aria-label={split.map((v, i) => `Stage ${i + 1} ${(v * 100).toFixed(1)}%`).join(", ")} className="flex h-3 overflow-hidden rounded-full">{split.map((v, i) => <span key={i} className={stageDot[(i + 1) as 1]} style={{ width: `${v * 100}%` }} />)}</div>
        <p className="flex gap-4 text-micro text-fg-muted">{split.map((v, i) => <span key={i}>Stage {i + 1} {(v * 100).toFixed(1)} %</span>)}</p>
      </Section>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Section title={`PD term structure — ${seg.segment}`}><div className="rounded-panel border border-line p-5"><TimeSeries title={`Cumulative PD, ${seg.segment} vs Retail`} data={TERM} x="month" format="plain" series={[{ key: seg.segment, label: seg.segment, color: "var(--chart-1)", value: seg.segment as "Retail" }, ...(seg.segment !== "Retail" ? [{ key: "Retail", label: "Retail", color: "var(--chart-6)", value: "Retail" as const }] : [])]} /></div></Section>
        <Section title="LGD summary"><KeyValue columns={1} className="rounded-panel border border-line p-5" items={[["Average LGD", seg.segment === "SME" ? "47.3 %" : "41.2 %"], ["Discounted collateral coverage", seg.segment === "SME" ? "52 %" : "61 %"]]} /></Section>
      </div>
      <Section title="Top contributors">
        <ul className="divide-y divide-line rounded-panel border border-line">{contributors.map((l) => <li key={l.id}><Link href={`${base(run.id)}&segment=${seg.segment}&loan=${l.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-surface/60"><span className="w-28 font-mono text-micro text-fg">{l.id}</span><StagePill stage={l.stage} /><span className="flex-1 text-right text-small tabular-nums"><Money value={l.ecl} /></span><ArrowRight aria-hidden className="size-4 text-fg-muted" /></Link></li>)}
          {!contributors.length && <li className="px-5 py-6 text-small text-fg-muted">No sample loans in this segment.</li>}</ul>
      </Section>
    </>
  );
}

/** R12 loan view: inputs, collateral, build-up waterfall, monthly table that ties to ECL. */
export function LoanView({ run, loanId }: { run: Run; loanId: string }) {
  const l = loans.find((x) => x.id === loanId) ?? loans[0];
  const detailed = l.id === "LN-000184";
  const total = loanSchedule.reduce((a, r) => a + r.loss, 0);
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Breadcrumb items={[{ label: "Portfolio", href: base(run.id) }, { label: l.segment, href: `${base(run.id)}&segment=${l.segment}` }, { label: l.id }]} />
        <span className="ml-auto flex gap-2"><CopyLink /><ExportMenu name={l.id} rows={[["Month", "Balance", "EAD", "Marginal PD", "LGD", "Discount factor", "Loss"], ...loanSchedule.map((r) => [r.month, r.balance.toFixed(2), r.ead.toFixed(2), r.pd.toFixed(4), r.lgd, r.df.toFixed(4), r.loss.toFixed(2)])]} /></span>
      </div>
      <div className="flex flex-wrap items-center gap-2"><h2 className="font-mono text-h3 text-fg">{l.id}</h2><Badge>{l.customer}</Badge><StagePill stage={l.stage} /><Badge>{l.segment}</Badge>{l.capped && <Badge tone="warning">Capped</Badge>}</div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <KeyValue columns={3} className="rounded-panel border border-line p-5" items={[["Outstanding", money(l.outstanding)], ["EIR", "12.50 %"], ["First payment", "15 Mar 2024"], ["Maturity", "15 Feb 2029"], ["Reporting date", "30 Sep 2026"], ["Treatment", `Stage ${l.stage} · ${l.stage === 1 ? "12 monthly rows" : l.stage === 2 ? "rows to maturity" : "single row"}`]]} />
        <div className="flex flex-col gap-2 rounded-panel border border-line p-5"><p className="text-small text-fg">Collateral</p><p className="text-micro text-fg-muted">Allocated share 45.2 %</p><p className="text-small tabular-nums text-fg-body">Residential property 54,240.00 → discounted <span className="text-fg">29,866.10</span></p></div>
      </div>
      <Section title="ECL build-up">
        <div className="rounded-panel border border-line p-5"><Waterfall title={`ECL build-up for ${l.id}`} height={200} increaseIsBad={false} steps={[{ label: "EAD", value: l.ead, kind: "total" }, { label: "× PD × LGD", value: -(l.ead - (l.ecl + 18.4)) }, { label: "Discount", value: -18.4 }, { label: "ECL", value: l.ecl, kind: "total" }]} />
          <p className="mt-2 font-mono text-micro text-fg-muted">EAD {money(l.ead)} × PD <PD value={l.pd} /> × LGD {(l.lgd * 100).toFixed(1)} % − discount (18.40) = ECL {money(l.ecl)}</p></div>
      </Section>
      {detailed ? (
        <Section title="Monthly ECL schedule">
          <div className="relative overflow-x-auto rounded-panel border border-line">
            <table className="w-full min-w-[760px] text-small tabular-nums"><caption className="sr-only">Monthly ECL schedule for {l.id}</caption>
              <thead><tr className="border-b border-line text-fg-muted">{["Month", "Since origination", "Balance · USD", "EAD · USD", "Marginal PD", "LGD", "Discount factor", "Loss · USD"].map((h, i) => <th key={h} scope="col" className={`px-3 py-2 font-normal ${i ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
              <tbody>
                {loanSchedule.map((r) => <tr key={r.month} className="border-b border-line"><td className="px-3 py-2">{r.month}</td><td className="px-3 text-right">{r.sinceOrigination}</td><td className="px-3 text-right">{money(r.balance)}</td><td className="px-3 text-right">{money(r.ead)}</td><td className="px-3 text-right font-mono">{r.pd.toFixed(4)}</td><td className="px-3 text-right">{(r.lgd * 100).toFixed(1)} %</td><td className="px-3 text-right font-mono">{r.df.toFixed(4)}</td><td className="px-3 text-right text-fg">{money(r.loss)}</td></tr>)}
                <tr><th scope="row" colSpan={7} className="px-3 py-2.5 text-left font-medium text-fg">Total</th><td className="px-3 text-right font-medium text-fg">{money(total)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="font-mono text-micro text-fg-muted">PD join key: {l.segment} · month 31 · Stage {l.stage} · Exceptions for this loan: none</p>
          <p className="text-micro text-fg-muted md:hidden">Full monthly table is easiest to read on desktop.</p>
        </Section>
      ) : <p className="rounded-panel border border-line p-5 text-small text-fg-muted">The monthly schedule for {l.id} is in Loan detail.xlsx. <Link href={`${base(run.id)}&segment=Retail&loan=LN-000184`} className="text-link hover:underline">See an example (LN-000184)</Link></p>}
    </>
  );
}
