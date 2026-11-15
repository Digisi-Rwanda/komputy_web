import { isComputed } from "@/lib/entitlements";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Banner } from "@/components/molecules/Banner";
import { RunHeader } from "@/components/organisms/ecl/RunHeader";
import { SummaryTab } from "@/components/organisms/ecl/SummaryTab";
import { LoanTable } from "@/components/organisms/ecl/LoanTable";
import { ExceptionsTab } from "@/components/organisms/ecl/ExceptionsTab";
import { AuditTab } from "@/components/organisms/ecl/AuditTab";
import { InputsTab, MethodologyTab, OutputsTab, ReconciliationTab, type InputFile, type OutputFile, type ReconCheck } from "@/components/organisms/ecl/StaticTabs";
import { RunLive } from "@/components/organisms/ecl/RunLive";
import { getRunAudit, getRunExceptions, getRunLoans, getRunView } from "@/server/dal/engine";
import { can } from "@/server/policy";
import { requireMember } from "@/server/session";
import { TABS } from "@/lib/nav";

export async function generateMetadata({ params }: PageProps<"/ecl/runs/[runId]/[tab]">): Promise<Metadata> {
  return { title: `Run ${(await params).runId.slice(-6)}` };
}

// Run detail (blueprint §11.5, R1-R8), live from the engine.
async function Body({ params }: { params: PageProps<"/ecl/runs/[runId]/[tab]">["params"] }) {
  const { runId, tab } = await params;
  if (!(TABS.run as readonly string[]).includes(tab)) notFound();
  const p = await requireMember("ecl.view");
  const r = await getRunView(p, runId);
  if (!r.ok) { if (r.status === 404) notFound(); return <Banner tone="negative">{r.error}</Banner>; }
  const run = r.data as typeof r.data & { reconciliation?: ReconCheck[]; inputs?: InputFile[]; outputs?: OutputFile[] };
  const [loans, exc, audit] = await Promise.all([
    tab === "results" && isComputed(run) ? getRunLoans(p, runId, { limit: 500 }) : null,
    tab === "exceptions" || tab === "summary" ? getRunExceptions(p, runId) : null,
    tab === "audit" ? getRunAudit(p, runId) : null,
  ]);
  const excRows = exc?.ok ? exc.data : [];
  const byCat = excRows.reduce<Record<string, number>>((a, x) => ({ ...a, [x.category]: (a[x.category] ?? 0) + 1 }), {});
  return (
    <>
      <RunLive runId={run.id} active={run.status === "computing" || (isComputed(run) && !run.outputs?.length)} />
      <RunHeader run={run} tab={tab} canDelete={can(p, "workspace.update") && !run.locked} canRerun={can(p, "ecl.prepare")} />
      {tab === "summary" && <SummaryTab run={run} checksTotal={run.checksTotal} exceptionsByCategory={byCat}
        segments={(run.segments ?? []).map((s) => ({ segment: s.segment, exposure: s.exposure, ecl: s.ecl, coverage: s.coverage, delta: 0 }))}
        review={{ me: p.userId, preparerId: run.createdById, canReview: can(p, "ecl.review"), canPrepare: can(p, "ecl.prepare") }} />}
      {tab === "results" && (isComputed(run) ? <LoanTable rows={loans?.ok ? loans.data.rows : []} runId={run.id} total={loans?.ok ? loans.data.total : 0} /> : <SummaryTab run={run} segments={[]} />)}
      {tab === "exceptions" && <ExceptionsTab rows={excRows} runId={run.id} />}
      {tab === "reconciliation" && <ReconciliationTab run={run} checks={run.reconciliation ?? []} />}
      {tab === "inputs" && <InputsTab run={run} files={run.inputs ?? []} />}
      {tab === "methodology" && <MethodologyTab run={run} />}
      {tab === "outputs" && <OutputsTab run={run} files={run.outputs ?? []} />}
      {tab === "audit" && <AuditTab events={audit?.ok ? audit.data : []} runId={run.id} />}
    </>
  );
}

export default function RunDetailPage({ params }: PageProps<"/ecl/runs/[runId]/[tab]">) {
  return <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body params={params} /></Suspense>;
}
