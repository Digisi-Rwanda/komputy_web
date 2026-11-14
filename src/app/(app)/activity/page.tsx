import type { Metadata } from "next";
import { PageHeader } from "@/components/organisms/PageHeader";
import { AuditLog } from "@/components/organisms/admin/AuditLog";
import { Suspense } from "react";
import { listAudit } from "@/server/dal/audit";
import { requireMember } from "@/server/session";

export const metadata: Metadata = { title: "Activity" };

// Workspace activity feed: everyone sees what happened across services (same events as the admin audit log).
async function Feed() {
  const p = await requireMember("activity.view");
  return <AuditLog events={await listAudit(p.tenantId)} />;
}

export default function ActivityPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Activity" }]} title="Activity" description="Everything that happened in this workspace, newest first." />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Feed /></Suspense>
    </>
  );
}
