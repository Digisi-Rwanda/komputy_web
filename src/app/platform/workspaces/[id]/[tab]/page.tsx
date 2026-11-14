import { notFound } from "next/navigation";
import { Suspense } from "react";
import { sql } from "drizzle-orm";
import { WorkspaceDetail } from "@/components/organisms/platform/WorkspaceDetail";
import { TABS } from "@/lib/nav";
import { db, schema } from "@/server/db/client";
import { listLeads, listPlatformWorkspaces, platformWorkspaceDetail } from "@/server/dal/platform";
import { requireStaff } from "@/server/session";

export const metadata = { title: "Workspace" };

async function Detail({ params }: { params: PageProps<"/platform/workspaces/[id]/[tab]">["params"] }) {
  const p = await requireStaff();
  const { id, tab } = await params;
  if (!(TABS.platformWorkspace as readonly string[]).includes(tab)) notFound();
  const [[ws], detail, leads, staff] = await Promise.all([
    listPlatformWorkspaces([id]), platformWorkspaceDetail(id), listLeads(id),
    db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(sql`${schema.users.platformRole} is not null`),
  ]);
  if (!ws || !detail.tenant) notFound();
  return <WorkspaceDetail ws={ws} tab={tab} tabs={TABS.platformWorkspace} detail={detail} leads={leads} staff={staff} me={p.userId} />;
}

// PA3 / PA4 / PA9.
export default function WorkspacePage({ params }: PageProps<"/platform/workspaces/[id]/[tab]">) {
  return <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Detail params={params} /></Suspense>;
}
