import type { Metadata } from "next";
import { Suspense } from "react";
import { LeasesHeader } from "@/components/organisms/leases/LeasesHeader";
import { Register } from "@/components/organisms/leases/Register";
import { getLeaseBook } from "@/server/dal/leases";
import { requireMember } from "@/server/session";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Lease register" };

async function Body({ searchParams }: { searchParams: PageProps<"/leases/register">["searchParams"] }) {
  const p = await requireMember("leases.view");
  const book = await getLeaseBook(p);
  return <Register leases={book.ok ? book.data.register : []} view={one((await searchParams).view) ?? "all"} />;
}

// LA-03.
export default function LeaseRegisterPage({ searchParams }: PageProps<"/leases/register">) {
  return (
    <>
      <LeasesHeader active="/leases/register" title="Register" />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body searchParams={searchParams} /></Suspense>
    </>
  );
}
