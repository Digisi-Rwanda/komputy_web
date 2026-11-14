import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SegmentedTabs } from "@/components/molecules/Tabs";
import { PageHeader } from "@/components/organisms/PageHeader";
import { CollateralSetup, SegmentsSetup, TemplatesSetup, ThresholdsSetup } from "@/components/organisms/ecl/Setup";
import { getCollateralSetup, getSegmentsSetup, getThresholds } from "@/data/mock/index";
import { TABS } from "@/lib/nav";

export const metadata: Metadata = { title: "ECL setup" };
export function generateStaticParams() { return TABS.eclSetup.map((tab) => ({ tab })); }

const LABELS: Record<string, string> = { segments: "Segments", collateral: "Collateral types", thresholds: "Validation thresholds", templates: "Templates & defaults" };

// ECL Setup (blueprint §11.8, E5–E8).
export default async function EclSetupPage({ params }: PageProps<"/ecl/setup/[tab]">) {
  const tab = (await params).tab;
  if (!LABELS[tab]) notFound();
  return (
    <>
      <PageHeader crumbs={[{ label: "Expected Credit Loss", href: "/ecl" }, { label: "Setup" }]} title="Setup"
        tabs={<SegmentedTabs active={`/ecl/setup/${tab}`} items={TABS.eclSetup.map((t) => ({ label: LABELS[t], href: `/ecl/setup/${t}` }))} />} />
      {tab === "segments" && <SegmentsSetup initial={getSegmentsSetup()} />}
      {tab === "collateral" && <CollateralSetup initial={getCollateralSetup()} />}
      {tab === "thresholds" && <ThresholdsSetup initial={getThresholds()} />}
      {tab === "templates" && <TemplatesSetup />}
    </>
  );
}
