import { isComputed } from "@/lib/entitlements";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Banner } from "@/components/molecules/Banner";
import { EclHeader } from "@/components/organisms/ecl/EclHeader";
import { EclOverview, EclOverviewEmpty } from "@/components/organisms/ecl/EclOverview";
import { getRunView, listRuns } from "@/server/dal/engine";
import { requireMember } from "@/server/session";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Expected Credit Loss" };

// ECL Overview (blueprint §11.2, E1/E2): the latest signed-off run (else the latest computed), trend across computed runs.
async function Body({ searchParams }: { searchParams: PageProps<"/ecl">["searchParams"] }) {
  const p = await requireMember("ecl.view");
  const res = await listRuns(p);
  if (!res.ok) return <Banner tone="negative">{res.error}</Banner>;
  const computed = res.data.filter((r) => isComputed(r) && r.status !== "archived");
  const latest = computed.find((r) => r.status === "signed-off") ?? computed[0];
  if (one((await searchParams).empty) || !latest) return <EclOverviewEmpty />;
  const detail = await getRunView(p, latest.id);
  const segments = (detail.ok ? detail.data.segments ?? [] : []).map((s) => ({ segment: s.segment, exposure: s.exposure, ecl: s.ecl, coverage: s.coverage, delta: 0 }));
  const trend = [...computed].reverse().slice(-12).map((r) => ({
    month: new Date(r.reportingDate || r.createdAt).toLocaleString("en-GB", { month: "short", year: "2-digit" }),
    s1: r.stages[0]?.ecl ?? 0, s2: r.stages[1]?.ecl ?? 0, s3: r.stages[2]?.ecl ?? 0,
  }));
  return <EclOverview run={latest} trend={trend} segments={segments} inProgress={res.data.filter((r) => ["draft", "validating", "computing", "needs-review", "returned"].includes(r.status)).slice(0, 3)} />;
}

export default function EclOverviewPage({ searchParams }: PageProps<"/ecl">) {
  return (
    <>
      <EclHeader active="/ecl" />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body searchParams={searchParams} /></Suspense>
    </>
  );
}
