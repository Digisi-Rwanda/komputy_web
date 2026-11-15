import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Money } from "@/components/atoms/Numbers";
import { StagePill, stageDot } from "@/components/atoms/StatusPill";
import { Breadcrumb } from "@/components/molecules/Breadcrumb";
import { HeroMetric, KeyValue, StatCard } from "@/components/molecules/StatCard";
import { Section } from "@/components/organisms/PageHeader";
import { StackedBars } from "@/components/organisms/StackedBars";
import { Waterfall } from "@/components/organisms/Waterfall";
import { compact, date, money, percent } from "@/lib/format";
import type { Run, SegmentResult, Stage } from "@/types/domain";
import { CopyLink, ExportMenu } from "@/components/organisms/ecl/ExplorerActions";

export type Explore = {
  loans: number; ecl: number; exposure: number; cureRate: number | null; avgLgd: number | null;
  stages: { stage: Stage; ecl: number; exposure: number; share: number }[];
  sizes: { bucket: string; ecl: number }[];
  top: { id: string; customer: string; segment: string; stage: Stage; outstanding: number; ecl: number; capped: boolean }[];
};
export type LoanDetail = {
  id: string; customer: string; segment: string; stage: Stage; reportingDate: string; outstanding: number; eclBeforeCap: number; ecl: number; capped: boolean;
  discountedCollateral: number; eir: number | null; treatment: string | null; pdRule: string | null;
  schedule: { month: string; sinceOrigination: number; balance: number; ead: number; pd: number; lgd: number; loss: number; discounted: number }[];
};

const base = (runId: string) => `/ecl/results?run=${runId}`;

function TopLoans({ run, rows, segment }: { run: Run; rows: Explore["top"]; segment?: string }) {
  return (
    <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[520px] text-small tabular-nums"><caption className="sr-only">Top loans by ECL{segment ? ` in ${segment}` : ""}</caption>
      <thead><tr className="border-b border-line text-fg-muted">{["Loan", "Segment", "Stage", `ECL · ${run.currency}`, "Coverage"].map((h, i) => <th key={h} scope="col" className={`px-4 py-2 font-normal ${i > 2 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((l) => <tr key={l.id} className="border-b border-line last:border-0"><td className="px-4 py-2.5"><Link href={`${base(run.id)}&segment=${encodeURIComponent(l.segment)}&loan=${encodeURIComponent(l.id)}`} className="font-mono text-micro text-fg hover:underline">{l.id}</Link>{l.capped && <Badge tone="warning" className="ml-2">Capped</Badge>}</td><td className="px-4 text-fg-body">{l.segment}</td><td className="px-4"><StagePill stage={l.stage} /></td><td className="px-4 text-right"><Money value={l.ecl} /></td><td className="px-4 text-right text-fg-muted">{percent(l.outstanding ? l.ecl / l.outstanding : 0)}</td></tr>)}
        {!rows.length && <tr><td colSpan={5} className="px-4 py-6 text-fg-muted">No loans.</td></tr>}</tbody>
    </table></div>
  );
}

/** R10 portfolio view. */
export function Portfolio({ run, segments, explore }: { run: Run; segments: SegmentResult[]; explore: Explore }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3"><Breadcrumb items={[{ label: "Portfolio" }]} /><span className="ml-auto"><ExportMenu name={`${run.name}-portfolio`} rows={[["Segment", "Exposure", "ECL", "Coverage"], ...segments.map((s) => [s.segment, s.exposure, s.ecl, s.coverage])]} /></span></div>
      <HeroMetric label="Total ECL" currency={run.currency} value={<Money value={run.totalEcl} />} sub={`${explore.loans.toLocaleString("en-US")} loans · coverage ${percent(run.coverage)}`} />
      <div className="grid gap-4 md:grid-cols-3">{explore.stages.map((s) => <StatCard key={s.stage} dot={stageDot[s.stage]} label={`Stage ${s.stage}`} value={`${run.currency} ${compact(s.ecl)}`} meta={`${percent(run.totalEcl ? s.ecl / run.totalEcl : 0, 1)} of total ECL`} />)}</div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="ECL by segment">
          <ul className="divide-y divide-line rounded-panel border border-line">{segments.map((s) => (
            <li key={s.segment}><Link href={`${base(run.id)}&segment=${encodeURIComponent(s.segment)}`} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-hover"><span className="w-28 truncate text-small text-fg">{s.segment}</span><span className="flex-1 text-right text-small tabular-nums"><Money value={s.ecl} /></span><span className="w-16 text-right text-micro text-fg-muted">{percent(s.coverage)}</span><ArrowRight aria-hidden className="size-4 text-fg-muted" /></Link></li>
          ))}</ul>
        </Section>
        <Section title="ECL distribution by loan size"><div className="rounded-panel border border-line p-5"><StackedBars title="ECL by loan size (outstanding)" data={explore.sizes} x="bucket" format="compact" height={180} series={[{ key: "ecl", label: "ECL", color: "var(--chart-1)", value: "ecl" }]} /></div></Section>
      </div>
      <Section title="Top 10 loans by ECL"><TopLoans run={run} rows={explore.top} /></Section>
    </>
  );
}

/** R11 segment view. */
export function SegmentView({ run, seg, segments, explore }: { run: Run; seg: SegmentResult; segments: SegmentResult[]; explore: Explore }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Breadcrumb items={[{ label: "Portfolio", href: base(run.id) }, { label: seg.segment }]} />
        <span className="flex flex-wrap gap-1">{segments.map((s) => <Link key={s.segment} href={`${base(run.id)}&segment=${encodeURIComponent(s.segment)}`} aria-current={s.segment === seg.segment ? "page" : undefined} className={`rounded-full px-3 py-1 text-micro ${s.segment === seg.segment ? "bg-surface-active text-fg" : "text-fg-muted hover:text-fg"}`}>{s.segment}</Link>)}</span>
        <span className="ml-auto"><ExportMenu name={`${run.name}-${seg.segment}`} rows={[["Loan", "Stage", "ECL"], ...explore.top.map((l) => [l.id, l.stage, l.ecl])]} /></span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label={`Exposure · ${run.currency}`} value={compact(seg.exposure)} /><StatCard label={`ECL · ${run.currency}`} value={money(seg.ecl)} /><StatCard label="Coverage" value={percent(seg.coverage)} />
        <StatCard label="Loans" value={explore.loans.toLocaleString("en-US")} /><StatCard label="Cure rate" value={explore.cureRate != null ? explore.cureRate.toFixed(4) : "No data"} />
      </div>
      <Section title="Stage split (exposure)">
        <div role="img" aria-label={explore.stages.map((s) => `Stage ${s.stage} ${(s.share * 100).toFixed(1)}%`).join(", ")} className="flex h-3 overflow-hidden rounded-full">{explore.stages.map((s) => <span key={s.stage} className={stageDot[s.stage]} style={{ width: `${s.share * 100}%` }} />)}</div>
        <p className="flex gap-4 text-micro text-fg-muted">{explore.stages.map((s) => <span key={s.stage}>Stage {s.stage} {(s.share * 100).toFixed(1)} %</span>)}</p>
      </Section>
      <Section title="LGD summary"><KeyValue columns={2} className="rounded-panel border border-line p-5" items={[["Average LGD", explore.avgLgd != null ? percent(explore.avgLgd, 1) : "No data"], ["ECL by loan size", explore.sizes.filter((b) => b.ecl).map((b) => `${b.bucket} ${compact(b.ecl)}`).join(" · ") || "No data"]]} /></Section>
      <Section title="Top contributors"><TopLoans run={run} rows={explore.top} segment={seg.segment} /></Section>
    </>
  );
}

/** R12 loan view: inputs, collateral, build-up, and the monthly table whose discounted losses tie to the ECL. */
export function LoanView({ run, loan: l }: { run: Run; loan: LoanDetail }) {
  const discounted = l.schedule.reduce((a, r) => a + r.discounted, 0);
  const capCut = l.eclBeforeCap - l.ecl;
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Breadcrumb items={[{ label: "Portfolio", href: base(run.id) }, { label: l.segment, href: `${base(run.id)}&segment=${encodeURIComponent(l.segment)}` }, { label: l.id }]} />
        <span className="ml-auto flex gap-2"><CopyLink /><ExportMenu name={l.id} rows={[["Month", "Since origination", "Balance", "EAD", "Marginal PD", "LGD", "Credit loss", "Discounted"], ...l.schedule.map((r) => [r.month, r.sinceOrigination, r.balance.toFixed(2), r.ead.toFixed(2), r.pd.toFixed(6), r.lgd.toFixed(6), r.loss.toFixed(2), r.discounted.toFixed(2)])]} /></span>
      </div>
      <div className="flex flex-wrap items-center gap-2"><h2 className="font-mono text-h3 text-fg">{l.id}</h2><Badge>{l.customer}</Badge><StagePill stage={l.stage} /><Badge>{l.segment}</Badge>{l.capped && <Badge tone="warning">Capped</Badge>}</div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <KeyValue columns={3} className="rounded-panel border border-line p-5" items={[["Outstanding", money(l.outstanding)], ["EIR", l.eir != null ? percent(l.eir, 2) : "Not set"], ["Reporting date", date(l.reportingDate)], ["Treatment", l.treatment ?? `Stage ${l.stage}`], ["PD rule", l.pdRule ?? "None"], ["Projection rows", String(l.schedule.length)]]} />
        <div className="flex flex-col gap-2 rounded-panel border border-line p-5"><p className="text-small text-fg">Collateral</p><p className="text-small tabular-nums text-fg-body">Discounted collateral <span className="text-fg">{money(l.discountedCollateral)}</span></p></div>
      </div>
      <Section title="ECL buildup">
        <div className="rounded-panel border border-line p-5"><Waterfall title={`ECL buildup for ${l.id}`} height={200} increaseIsBad={false} steps={[{ label: "Discounted losses", value: l.eclBeforeCap, kind: "total" }, ...(capCut > 0.005 ? [{ label: "Cap at outstanding", value: -capCut }] : []), { label: "ECL", value: l.ecl, kind: "total" as const }]} />
          <p className="mt-2 font-mono text-micro text-fg-muted">Σ discounted monthly losses {money(discounted)}{capCut > 0.005 ? ` − cap ${money(capCut)}` : ""} = ECL {money(l.ecl)}</p></div>
      </Section>
      <Section title="Monthly ECL schedule">
        <div className="relative overflow-x-auto rounded-panel border border-line">
          <table className="w-full min-w-[820px] text-small tabular-nums"><caption className="sr-only">Monthly ECL schedule for {l.id}</caption>
            <thead><tr className="border-b border-line text-fg-muted">{["Month", "Since origination", `Balance · ${run.currency}`, `EAD · ${run.currency}`, "Marginal PD", "LGD", "Credit loss", "Discounted"].map((h, i) => <th key={h} scope="col" className={`px-3 py-2 font-normal ${i ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
            <tbody>
              {l.schedule.map((r, i) => <tr key={i} className="border-b border-line"><td className="px-3 py-2">{r.month}</td><td className="px-3 text-right">{r.sinceOrigination}</td><td className="px-3 text-right">{money(r.balance)}</td><td className="px-3 text-right">{money(r.ead)}</td><td className="px-3 text-right font-mono">{r.pd.toFixed(4)}</td><td className="px-3 text-right">{(r.lgd * 100).toFixed(1)} %</td><td className="px-3 text-right">{money(r.loss)}</td><td className="px-3 text-right text-fg">{money(r.discounted)}</td></tr>)}
              <tr><th scope="row" colSpan={7} className="px-3 py-2.5 text-left font-medium text-fg">Total (before cap)</th><td className="px-3 text-right font-medium text-fg">{money(discounted)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-micro text-fg-muted md:hidden">The monthly table is easiest to read on desktop.</p>
      </Section>
    </>
  );
}
