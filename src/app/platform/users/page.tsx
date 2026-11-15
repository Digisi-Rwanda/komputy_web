import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/organisms/PageHeader";
import { PlatformUsers } from "@/components/organisms/platform/PlatformUsers";
import { listPeople } from "@/server/dal/platform";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Users" };

async function Body() {
  const p = await requireStaff();
  return <PlatformUsers data={await listPeople()} me={p.userId} />;
}

// PA7.
export default function Page() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Platform", href: "/platform" }, { label: "Users" }]} title="Users" description="Everyone with a Komputy login, and our own staff." />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body /></Suspense>
    </>
  );
}
