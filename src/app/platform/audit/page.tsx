import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/organisms/PageHeader";
import { PlatformAudit } from "@/components/organisms/platform/Ops";
import { platformAudit } from "@/server/dal/platform";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Platform audit" };

async function Body() {
  await requireStaff();
  return <PlatformAudit rows={await platformAudit()} />;
}

// PA8.3.
export default function Page() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Platform", href: "/platform" }, { label: "Platform audit" }]} title="Platform audit" description="Every action our staff take on client workspaces." />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body /></Suspense>
    </>
  );
}
