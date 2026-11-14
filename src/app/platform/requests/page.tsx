import type { Metadata } from "next";
import { Suspense } from "react";
import { sql } from "drizzle-orm";
import { PageHeader } from "@/components/organisms/PageHeader";
import { RequestsPipeline } from "@/components/organisms/platform/RequestsPipeline";
import { db, schema } from "@/server/db/client";
import { listLeads } from "@/server/dal/platform";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Requests" };

async function Pipeline() {
  await requireStaff();
  const [leads, staff] = await Promise.all([listLeads(), db.select({ name: schema.users.name }).from(schema.users).where(sql`${schema.users.platformRole} is not null`)]);
  return <RequestsPipeline initial={leads} assignees={staff.map((s) => s.name)} />;
}

// PA5.
export default function Page() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Platform", href: "/platform" }, { label: "Requests" }]} title="Requests" description="Quotes, trials, capacity and waitlist requests from clients and the public site." />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Pipeline /></Suspense>
    </>
  );
}
