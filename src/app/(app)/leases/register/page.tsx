import type { Metadata } from "next";
import { Suspense } from "react";
import { LeasesHeader } from "@/components/organisms/leases/LeasesHeader";
import { Register } from "@/components/organisms/leases/Register";
import { getLeases } from "@/data/mock/index";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Lease register" };

async function Body({ searchParams }: { searchParams: PageProps<"/leases/register">["searchParams"] }) {
  return <Register leases={getLeases()} view={one((await searchParams).view) ?? "all"} />;
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
