import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RunHeader } from "@/components/organisms/ecl/RunHeader";
import { SummaryTab } from "@/components/organisms/ecl/SummaryTab";
import { LoanTable } from "@/components/organisms/ecl/LoanTable";
import { ExceptionsTab } from "@/components/organisms/ecl/ExceptionsTab";
import { AuditTab } from "@/components/organisms/ecl/AuditTab";
import { InputsTab, MethodologyTab, OutputsTab, ReconciliationTab } from "@/components/organisms/ecl/StaticTabs";
import { getRun, getRuns, getSegments, results } from "@/data/mock/index";
import { TABS } from "@/lib/nav";

export function generateStaticParams() { return getRuns().flatMap((r) => TABS.run.map((tab) => ({ runId: r.id, tab }))); }
export async function generateMetadata({ params }: PageProps<"/ecl/runs/[runId]/[tab]">): Promise<Metadata> {
  const r = getRun((await params).runId);
  return { title: r ? `${r.id} · ${r.name}` : "Run" };
}

// Run detail (blueprint §11.5, R1–R8).
export default async function RunDetailPage({ params }: PageProps<"/ecl/runs/[runId]/[tab]">) {
  const { runId, tab } = await params;
  const run = getRun(runId);
  if (!run || !(TABS.run as readonly string[]).includes(tab)) notFound();
  return (
    <>
      <RunHeader run={run} tab={tab} />
      {tab === "summary" && <SummaryTab run={run} segments={getSegments()} />}
      {tab === "results" && (run.totalEcl ? <LoanTable rows={results.loans} runId={run.id} /> : <SummaryTab run={run} segments={[]} />)}
      {tab === "exceptions" && <ExceptionsTab rows={run.totalEcl ? results.exceptions : []} runId={run.id} />}
      {tab === "reconciliation" && <ReconciliationTab run={run} />}
      {tab === "inputs" && <InputsTab run={run} />}
      {tab === "methodology" && <MethodologyTab run={run} />}
      {tab === "outputs" && <OutputsTab run={run} />}
      {tab === "audit" && <AuditTab events={run.id === "RUN-0142" ? results.runAudit : results.runAudit.slice(0, 2).map((e) => ({ ...e, object: run.id }))} runId={run.id} />}
    </>
  );
}
