import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { EclHeader } from "@/components/organisms/ecl/EclHeader";
import { RunsTable } from "@/components/organisms/ecl/RunsTable";
import { QuotaGate } from "@/components/organisms/access/Quota";
import { entitlement } from "@/lib/entitlements";
import { getRuns, getWorkspace } from "@/data/mock/index";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Runs" };

// Runs list (blueprint §11.3, E3/E4, AC5). `?state=empty|loading` previews the other states; `?quota=full` the quota gate.
async function Body({ searchParams }: { searchParams: PageProps<"/ecl/runs">["searchParams"] }) {
  const sp = await searchParams;
  const state = one(sp.state);
  const runs = state === "empty" ? [] : getRuns();
  const q = entitlement(getWorkspace(), "ecl").quota!;
  const used = one(sp.quota) === "full" ? q.limit : q.used;
  return (
    <>
      <EclHeader active="/ecl/runs" title="Runs" meta={<span className="text-small text-fg-muted">{runs.length} runs</span>}
        actions={<QuotaGate used={used} limit={q.limit}><Button asChild icon={<Icon name="plus" />}><Link href="/ecl/runs/new">New run</Link></Button></QuotaGate>} />
      <RunsTable runs={runs} loading={state === "loading"} />
    </>
  );
}

export default function RunsPage({ searchParams }: PageProps<"/ecl/runs">) {
  return <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body searchParams={searchParams} /></Suspense>;
}
