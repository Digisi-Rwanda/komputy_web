import type { Metadata } from "next";
import { Suspense } from "react";
import { MetaChip } from "@/components/atoms/Chip";
import { PageHeader } from "@/components/organisms/PageHeader";
import { HealthList, PlatformOverview } from "@/components/organisms/platform/PlatformOverview";
import { platformOverview } from "@/server/dal/platform";
import { probes } from "@/server/health";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Platform overview" };

async function Body() {
  await requireStaff();
  // Health streams separately so a slow dependency never holds the rest of the page.
  return <PlatformOverview data={await platformOverview()} health={<Suspense fallback={<p className="text-small text-fg-muted">Checking…</p>}><HealthMini /></Suspense>} />;
}

async function HealthMini() {
  return <HealthList probes={(await probes()).slice(0, 4)} />;
}

// PA1.
export default function PlatformOverviewPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Platform" }, { label: "Overview" }]} title="Platform overview" meta={<MetaChip>Live</MetaChip>} />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body /></Suspense>
    </>
  );
}
