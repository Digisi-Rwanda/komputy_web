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
  const data = (r?.data as { data?: { versions?: { version: string; service: string; status: string; notes: string | null; createdAt: string }[] } } | undefined)?.data?.versions;
  if (!data) return <Engines rows={[]} canPromote={false} error="The engine API isn't reachable right now. Check Health." />;
  const rows: EngineRow[] = data.map((v) => ({ version: `${v.service}@${v.version}`, current: v.status === "promoted", released: v.createdAt.slice(0, 10), pinned: 0, changelog: v.notes ? [v.notes] : [] }));
  return <Engines rows={rows} canPromote={can(p, "engine.promote")} />;
}

// PA8.1 (source: engine.engine_versions).
export default function Page() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Platform", href: "/platform" }, { label: "Engines" }]} title="Engines" description="Calculation engine versions. Promoting changes the default for new runs." />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body /></Suspense>
    </>
  );
}
