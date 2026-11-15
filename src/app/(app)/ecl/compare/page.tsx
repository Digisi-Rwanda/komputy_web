import { isComputed } from "@/lib/entitlements";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Money, Delta } from "@/components/atoms/Numbers";
import { Banner } from "@/components/molecules/Banner";
import { PageHeader, Section } from "@/components/organisms/PageHeader";
import { Waterfall } from "@/components/organisms/Waterfall";
import { RunPicker } from "@/components/organisms/ecl/RunPicker";
import { compact, money, percent } from "@/lib/format";
import { getComparison, listRuns } from "@/server/dal/engine";
import { requireMember } from "@/server/session";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Compare runs" };

async function Body({ searchParams }: { searchParams: PageProps<"/ecl/compare">["searchParams"] }) {
  const sp = await searchParams;
  const p = await requireMember("ecl.view");
  const all = await listRuns(p);
  if (!all.ok) return <Banner tone="negative">{all.error}</Banner>;
  const computed = all.data.filter(isComputed);
  if (computed.length < 2) return <Banner tone="info">Compare needs two computed runs. Compute another run to see how ECL moved.</Banner>;
  const b = computed.find((r) => r.id === one(sp.b)) ?? computed[0];
  const a = computed.find((r) => r.id === one(sp.a)) ?? computed.find((r) => r.id !== b.id)!;
  const cmp = await getComparison(p, a.id, b.id);
  if (!cmp.ok) return <Banner tone="negative">{cmp.error}</Banner>;
  const d = b.totalEcl - a.totalEcl;
  const kpi: [string, React.ReactNode, React.ReactNode, React.ReactNode][] = [
    [`Total ECL · ${b.currency}`, <Money key="a" value={a.totalEcl} />, <Money key="b" value={b.totalEcl} />, <span key="d" className="flex flex-col"><Money value={d} signed /><Delta value={a.totalEcl ? d / a.totalEcl : 0} /></span>],
    [`Exposure · ${b.currency}`, compact(a.exposure), compact(b.exposure), compact(b.exposure - a.exposure)],
    ["Coverage", percent(a.coverage), percent(b.coverage), `${((b.coverage - a.coverage) * 100).toFixed(2)} pp`],
    ["Loans", a.loans.toLocaleString("en-US"), b.loans.toLocaleString("en-US"), (b.loans - a.loans).toLocaleString("en-US")],
  ];
  return (
    <>
      <div className="flex flex-wrap items-center gap-3"><RunPicker label="Run A" param="a" value={a.id} runs={computed} /><ArrowLeftRight aria-hidden className="size-4 text-fg-muted" /><RunPicker label="Run B" param="b" value={b.id} runs={computed} /></div>
      {a.engine !== b.engine ? <Banner tone="warning">Engine versions differ ({a.engine} → {b.engine}). Part of the movement may come from methodology changes.</Banner> : <Banner tone="info">Engine versions equal ({a.engine}).</Banner>}
      <div className="relative overflow-x-auto rounded-panel border border-line">
        <table className="w-full min-w-[560px] text-small tabular-nums"><caption className="sr-only">Key figures, run A versus run B</caption>
          <thead><tr className="border-b border-line text-fg-muted"><th scope="col" className="px-4 py-2 text-left font-normal">Measure</th><th scope="col" className="px-4 py-2 text-right font-normal">{a.name}</th><th scope="col" className="px-4 py-2 text-right font-normal">{b.name}</th><th scope="col" className="px-4 py-2 text-right font-normal">Δ</th></tr></thead>
          <tbody>{kpi.map(([k, x, y, z]) => <tr key={k} className="border-b border-line last:border-0"><th scope="row" className="px-4 py-3 text-left font-normal text-fg-body">{k}</th><td className="px-4 text-right">{x}</td><td className="px-4 text-right text-fg">{y}</td><td className="px-4 text-right">{z}</td></tr>)}</tbody>
        </table>
      </div>
      <Section title="ECL movement"><div className="rounded-panel border border-line p-5"><Waterfall title={`ECL movement ${a.name} to ${b.name}`} steps={cmp.data.movement} /></div></Section>
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Stage migration (loans)">
          <div className="relative overflow-x-auto rounded-panel border border-line p-5"><table className="w-full text-small tabular-nums"><caption className="sr-only">Loans by stage in run A (rows) and run B (columns)</caption>
            <thead><tr><td /><th scope="col" className="px-3 py-1 text-right font-normal text-fg-muted">S1</th><th scope="col" className="px-3 py-1 text-right font-normal text-fg-muted">S2</th><th scope="col" className="px-3 py-1 text-right font-normal text-fg-muted">S3</th></tr></thead>
            <tbody>{cmp.data.migration.map((r, i) => <tr key={i} className="border-t border-line"><th scope="row" className="px-3 py-2 text-left font-normal text-fg-muted">S{i + 1}</th>{r.map((v, j) => <td key={j} className={`px-3 text-right ${i === j ? "text-fg" : j > i ? "text-warning" : "text-positive"}`}>{v.toLocaleString("en-US")}</td>)}</tr>)}</tbody>
          </table><p className="mt-3 text-micro text-fg-muted">Rows: stage in {a.name}. Columns: stage in {b.name}. Loans in both runs only. Amber = deteriorated, green = improved.</p></div>
        </Section>
        <Section title="By segment">
          <div className="relative overflow-x-auto rounded-panel border border-line"><table className="w-full min-w-[420px] text-small tabular-nums"><caption className="sr-only">ECL by segment, both runs</caption>
            <thead><tr className="border-b border-line text-fg-muted">{["Segment", `ECL ${a.name}`, `ECL ${b.name}`, "Δ"].map((h, i) => <th key={h} scope="col" className={`px-4 py-2 font-normal ${i ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
            <tbody>{cmp.data.segments.map((s) => <tr key={s.segment} className="border-b border-line last:border-0"><th scope="row" className="px-4 py-2.5 text-left font-normal text-fg">{s.segment}</th><td className="px-4 text-right">{money(s.a)}</td><td className="px-4 text-right">{money(s.b)}</td><td className="px-4 text-right"><Delta value={s.delta} /></td></tr>)}</tbody>
          </table></div>
        </Section>
      </div>
    </>
  );
}

// Compare runs (blueprint §11.5, R9).
export default function ComparePage({ searchParams }: PageProps<"/ecl/compare">) {
  return (
    <>
      <PageHeader crumbs={[{ label: "Expected Credit Loss", href: "/ecl" }, { label: "Runs", href: "/ecl/runs" }, { label: "Compare" }]} title="Compare runs" />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body searchParams={searchParams} /></Suspense>
    </>
  );
}
