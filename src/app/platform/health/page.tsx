import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/organisms/PageHeader";
import { Health } from "@/components/organisms/platform/Ops";
import { probes } from "@/server/health";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Health" };

async function Body() {
  await requireStaff();
  return <Health probes={await probes()} checkedAt={new Date().toISOString()} />;
}

// PA8.2.
export default function Page() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Platform", href: "/platform" }, { label: "Health" }]} title="Health" description="Live status of the platform, probed from the web server." />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body /></Suspense>
    </>
  );
}
