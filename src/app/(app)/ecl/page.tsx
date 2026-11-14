import type { Metadata } from "next";
import { Suspense } from "react";
import { EclHeader } from "@/components/organisms/ecl/EclHeader";
import { EclOverview, EclOverviewEmpty } from "@/components/organisms/ecl/EclOverview";
import { getEclTrend, getRun, getRuns, getSegments } from "@/data/mock/index";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Expected Credit Loss" };

// ECL Overview (blueprint §11.2, E1/E2). `?empty=1` previews the no-runs state.
async function Body({ searchParams }: { searchParams: PageProps<"/ecl">["searchParams"] }) {
  if (one((await searchParams).empty)) return <EclOverviewEmpty />;
  const latest = getRuns().find((r) => r.status === "signed-off") ?? getRun("RUN-0142")!;
  return <EclOverview run={latest} trend={getEclTrend()} segments={getSegments()} inProgress={getRuns().filter((r) => ["validating", "ready", "computing", "needs-review"].includes(r.status)).slice(0, 3)} />;
}

export default function EclOverviewPage({ searchParams }: PageProps<"/ecl">) {
  return (
    <>
      <EclHeader active="/ecl" />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body searchParams={searchParams} /></Suspense>
    </>
  );
}
