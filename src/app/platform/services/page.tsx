import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/organisms/PageHeader";
import { ServicesEditor, type CatalogDoc } from "@/components/organisms/platform/ServicesEditor";
import { getCatalog } from "@/server/dal/platform";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Services & plans" };

async function Body() {
  await requireStaff("catalog.publish");
  const c = await getCatalog();
  if (!c) return <p className="text-small text-fg-muted">No catalog yet. Run the seed or publish one.</p>;
  return <ServicesEditor draft={c.draft as CatalogDoc} published={c.published as CatalogDoc} />;
}

// PA6 (feeds /pricing when published).
export default function Page() {
  return (
    <>
      <PageHeader crumbs={[{ label: "Platform", href: "/platform" }, { label: "Services & plans" }]} title="Services & plans" description="Feeds the public pricing page. Changes go live when you publish." />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body /></Suspense>
    </>
  );
}
