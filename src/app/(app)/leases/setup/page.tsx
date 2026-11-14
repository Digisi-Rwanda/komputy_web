import type { Metadata } from "next";
import { Suspense } from "react";
import { TrialReady } from "@/components/organisms/access/TrialReady";
import { LeasesHeader } from "@/components/organisms/leases/LeasesHeader";
import { SetupGate } from "@/components/organisms/leases/SetupGate";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Leases setup" };

async function Body({ searchParams }: { searchParams: PageProps<"/leases/setup">["searchParams"] }) {
  const q = await searchParams;
  return <>{one(q.trial) === "started" && <TrialReady />}<SetupGate initialStep={one(q.step) ?? "policies"} /></>;
}

// LA-01 setup gate (maker-checker per step); AC3 trial-ready card after "Start trial".
export default function LeasesSetupPage({ searchParams }: PageProps<"/leases/setup">) {
  return (
    <>
      <LeasesHeader title="Setup" newDisabled description="Each step is prepared by one person and approved by another." />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body searchParams={searchParams} /></Suspense>
    </>
  );
}
