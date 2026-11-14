import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/organisms/PageHeader";
import { Engines, type EngineRow } from "@/components/organisms/platform/Ops";
import { engine } from "@/server/engine/client";
import { can } from "@/server/policy";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Engines" };

async function Body() {
  const p = await requireStaff();
  const r = await engine(p, null).GET("/api/v1/platform/engine-versions").catch(() => null);
  const data = (r?.data as { data?: { versions?: { version: string; is_current: boolean; release_date: string; tenants_pinned: number; changelog: string[] }[] } } | undefined)?.data?.versions;
  if (!data) return <Engines rows={[]} canPromote={false} error="The engine API isn't reachable right now. Check Health." />;
  const rows: EngineRow[] = data.map((v) => ({ version: v.version, current: v.is_current, released: v.release_date, pinned: v.tenants_pinned, changelog: v.changelog }));
  return <Engines rows={rows} canPromote={can(p, "engine.promote")} />;
}

// PA8.1 (source: ECL-Server engine_versions).
export default function Page() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Platform", href: "/platform" }, { label: "Engines" }]} title="Engines" description="Calculation engine versions. Promoting changes the default for new runs." />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body /></Suspense>
    </>
  );
}
