import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Banner } from "@/components/molecules/Banner";
import { SegmentedTabs } from "@/components/molecules/Tabs";
import { PageHeader } from "@/components/organisms/PageHeader";
import { CollateralSetup, SegmentsSetup, TemplatesSetup, ThresholdsSetup } from "@/components/organisms/ecl/Setup";
import { getEclSetup } from "@/server/dal/engine";
import { can } from "@/server/policy";
import { requireMember } from "@/server/session";
import { TABS } from "@/lib/nav";

export const metadata: Metadata = { title: "ECL setup" };

const LABELS: Record<string, string> = { segments: "Segments", collateral: "Collateral types", thresholds: "Validation thresholds", templates: "Templates & defaults" };

async function Body({ tab }: { tab: string }) {
  const p = await requireMember("ecl.view");
  if (tab === "templates") return <TemplatesSetup admin={can(p, "workspace.update")} />;
  const s = await getEclSetup(p);
  const canEdit = can(p, "ecl.review");
  return (
    <>
      {s.error && <Banner tone="negative">{s.error}</Banner>}
      {tab === "segments" && <SegmentsSetup initial={s.segments} canEdit={canEdit} />}
      {tab === "collateral" && <CollateralSetup initial={s.collateral} canEdit={canEdit} />}
      {tab === "thresholds" && <ThresholdsSetup initial={s.thresholds} canEdit={canEdit} />}
    </>
  );
}

// ECL Setup (blueprint §11.8, E5-E8), live from the engine.
export default async function EclSetupPage({ params }: PageProps<"/ecl/setup/[tab]">) {
  const tab = (await params).tab;
  if (!LABELS[tab]) notFound();
  return (
    <>
      <PageHeader crumbs={[{ label: "Expected Credit Loss", href: "/ecl" }, { label: "Setup" }]} title="Setup"
        tabs={<SegmentedTabs active={`/ecl/setup/${tab}`} items={TABS.eclSetup.map((t) => ({ label: LABELS[t], href: `/ecl/setup/${t}` }))} />} />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body tab={tab} /></Suspense>
    </>
  );
}
