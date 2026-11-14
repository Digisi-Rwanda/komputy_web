import type { Metadata } from "next";
import { Suspense } from "react";
import { EclHeader } from "@/components/organisms/ecl/EclHeader";
import { LoanView, Portfolio, SegmentView } from "@/components/organisms/ecl/Explorer";
import { RunPicker } from "@/components/organisms/ecl/RunPicker";
import { getRun, getRuns, getSegments } from "@/data/mock/index";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Results explorer" };

// Results explorer (blueprint §11.6, R10–R12): Portfolio › Segment › Loan, run picker defaults to the latest signed-off run.
async function Body({ searchParams }: { searchParams: PageProps<"/ecl/results">["searchParams"] }) {
  const sp = await searchParams;
  const signed = getRuns().filter((r) => r.status === "signed-off");
  const run = getRun(one(sp.run)) ?? signed[0];
  const segs = getSegments(), seg = segs.find((s) => s.segment === one(sp.segment));
  const loan = one(sp.loan);
  return (
    <>
      <RunPicker label="Run" param="run" value={run.id} runs={signed} />
      {loan ? <LoanView run={run} loanId={loan} /> : seg ? <SegmentView run={run} seg={seg} segments={segs} /> : <Portfolio run={run} segments={segs} />}
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
