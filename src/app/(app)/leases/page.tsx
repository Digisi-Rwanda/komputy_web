import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/atoms/Button";
import { Banner } from "@/components/molecules/Banner";
import { StateView } from "@/components/organisms/StateView";
import { LeasesHeader } from "@/components/organisms/leases/LeasesHeader";
import { LeasesOverview } from "@/components/organisms/leases/LeasesOverview";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Lease Accounting" };

// LA-02. `?state=setup|empty|loading` previews the other states.
async function Body({ searchParams }: { searchParams: PageProps<"/leases">["searchParams"] }) {
  const s = one((await searchParams).state);
  if (s === "loading") return <div className="flex flex-col gap-4"><div className="skeleton h-40 rounded-panel" /><div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-panel" />)}</div></div>;
  if (s === "setup") return <Banner tone="warning" action={<Button asChild size="sm"><Link href="/leases/setup">Finish setup</Link></Button>}>Setup is 3 of 5 approved. New leases unlock once policies and rate curves are approved.</Banner>;
  if (s === "empty") return <StateView icon="file" title="No leases yet" description="Add your first lease or import a register from Excel." action={<div className="flex gap-2"><Button asChild><Link href="/leases/new">New lease</Link></Button><Button asChild variant="secondary"><Link href="/leases/imports">Import</Link></Button></div>} />;
  return <LeasesOverview />;
}

export default function LeasesPage({ searchParams }: PageProps<"/leases">) {
  return (
    <>
      <LeasesHeader active="/leases" />
      <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body searchParams={searchParams} /></Suspense>
    </>
  );
}
