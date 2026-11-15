import { isComputed } from "@/lib/entitlements";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Banner } from "@/components/molecules/Banner";
import { EclHeader } from "@/components/organisms/ecl/EclHeader";
import { EclOverviewEmpty } from "@/components/organisms/ecl/EclOverview";
import { LoanView, Portfolio, SegmentView } from "@/components/organisms/ecl/Explorer";
import { RunPicker } from "@/components/organisms/ecl/RunPicker";
import { getExplore, getLoanDetail, getRunView, listRuns } from "@/server/dal/engine";
import { requireMember } from "@/server/session";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Results explorer" };

// Results explorer (blueprint §11.6, R10–R12): Portfolio › Segment › Loan. Defaults to the latest signed-off run.
async function Body({ searchParams }: { searchParams: PageProps<"/ecl/results">["searchParams"] }) {
  const sp = await searchParams;
  const p = await requireMember("ecl.view");
  const all = await listRuns(p);
  if (!all.ok) return <Banner tone="negative">{all.error}</Banner>;
  const computed = all.data.filter(isComputed);
  const pick = computed.find((r) => r.id === one(sp.run)) ?? computed.find((r) => r.status === "signed-off") ?? computed[0];
  if (!pick) return <EclOverviewEmpty />;
  const [view, explore] = await Promise.all([getRunView(p, pick.id), getExplore(p, pick.id, one(sp.segment) || undefined)]);
  if (!view.ok || !explore.ok) return <Banner tone="negative">{!view.ok ? view.error : !explore.ok ? explore.error : ""}</Banner>;
  const run = view.data;
  const segs = (run.segments ?? []).map((s) => ({ segment: s.segment, exposure: s.exposure, ecl: s.ecl, coverage: s.coverage, delta: 0 }));
  const seg = segs.find((s) => s.segment === one(sp.segment));
  const loanId = one(sp.loan);
  const loan = loanId ? await getLoanDetail(p, run.id, loanId) : null;
  return (
    <>
      <RunPicker label="Run" param="run" value={run.id} runs={computed} />
      {loan ? (loan.ok ? <LoanView run={run} loan={loan.data} /> : <Banner tone="negative">{loan.error}</Banner>)
        : seg ? <SegmentView run={run} seg={seg} segments={segs} explore={explore.data} /> : <Portfolio run={run} segments={segs} explore={explore.data} />}
    </>
  );
}

export default function ResultsPage({ searchParams }: PageProps<"/ecl/results">) {
  return (
    <>
      <EclHeader active="/ecl/results" title="Results" />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body searchParams={searchParams} /></Suspense>
    </>
  );
}
