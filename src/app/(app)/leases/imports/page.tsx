import type { Metadata } from "next";
import { Suspense } from "react";
import { Imports } from "@/components/organisms/leases/Imports";
import { LeasesHeader } from "@/components/organisms/leases/LeasesHeader";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Imports" };

async function Body({ searchParams }: { searchParams: PageProps<"/leases/imports">["searchParams"] }) {
  return <Imports initialStep={one((await searchParams).step)} />;
}

// LC-02.
export default function ImportsPage({ searchParams }: PageProps<"/leases/imports">) {
  return (
    <>
      <LeasesHeader title="Imports" description="Bulk-create leases from Excel or CSV. Rows land as drafts." />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body searchParams={searchParams} /></Suspense>
    </>
  );
}
