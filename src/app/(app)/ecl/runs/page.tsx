import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { EclHeader } from "@/components/organisms/ecl/EclHeader";
import { RunsTable } from "@/components/organisms/ecl/RunsTable";
import { QuotaGate } from "@/components/organisms/access/Quota";
import { entitlement } from "@/lib/entitlements";
import { Banner } from "@/components/molecules/Banner";
import { getUsage, listRuns } from "@/server/dal/engine";
import { getWorkspace } from "@/server/dal/workspace";
import { requireMember } from "@/server/session";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Runs" };

// Runs list (blueprint §11.3, E3/E4, AC5). `?state=empty|loading` previews the other states; `?quota=full` the quota gate.
async function Body({ searchParams }: { searchParams: PageProps<"/ecl/runs">["searchParams"] }) {
  const sp = await searchParams;
  const state = one(sp.state);
  const p = await requireMember("ecl.view");
  const [res, ws, usage] = await Promise.all([listRuns(p), getWorkspace(p.tenantId), getUsage(p)]);
  const runs = state === "empty" || !res.ok ? [] : res.data;
  const q = entitlement(ws!, "ecl").quota ?? { used: 0, limit: Infinity, unit: "runs / month" };
  const used = one(sp.quota) === "full" ? q.limit : usage.ok ? usage.data.ecl.runsThisMonth : 0;
  return (
    <>
      <EclHeader active="/ecl/runs" title="Runs" meta={<span className="text-small text-fg-muted">{runs.length} runs</span>}
        actions={<QuotaGate used={used} limit={q.limit}><Button asChild icon={<Icon name="plus" />}><Link href="/ecl/runs/new">New run</Link></Button></QuotaGate>} />
      {!res.ok && <Banner tone="negative">{res.error}</Banner>}
      <RunsTable runs={runs} loading={state === "loading"} />
    </>
  );
}

export default function RunsPage({ searchParams }: PageProps<"/ecl/runs">) {
  return <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body searchParams={searchParams} /></Suspense>;
}
