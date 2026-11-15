import type { Metadata } from "next";
import { PageHeader } from "@/components/organisms/PageHeader";
import { Reports } from "@/components/organisms/ecl/Reports";
import { Suspense } from "react";
import { Banner } from "@/components/molecules/Banner";
import { listRuns } from "@/server/dal/engine";
import { requireMember } from "@/server/session";

export const metadata: Metadata = { title: "Reports" };

// Reports & exports (blueprint §11.7, R13/R14).
export default function ReportsPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Expected Credit Loss", href: "/ecl" }, { label: "Reports" }]} title="Reports" description="Disclosure-ready packs per signed-off run." />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body /></Suspense>
    </>
  );
}

async function Body() {
  const p = await requireMember("ecl.view");
  const r = await listRuns(p);
  return r.ok ? <Reports runs={r.data} /> : <Banner tone="negative">{r.error}</Banner>;
}
