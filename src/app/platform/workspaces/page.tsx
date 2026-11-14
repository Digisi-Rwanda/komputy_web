import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/organisms/PageHeader";
import { WorkspacesList } from "@/components/organisms/platform/WorkspacesList";
import { listPlatformWorkspaces } from "@/server/dal/platform";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Workspaces" };

async function List() {
  await requireStaff();
  return <WorkspacesList rows={await listPlatformWorkspaces()} />;
}

// PA2.
export default function Page() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Platform", href: "/platform" }, { label: "Workspaces" }]} title="Workspaces" description="Every client workspace, its services and usage." />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><List /></Suspense>
    </>
  );
}
