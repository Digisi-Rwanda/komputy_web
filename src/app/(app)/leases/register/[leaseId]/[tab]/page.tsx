import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LeaseDetail } from "@/components/organisms/leases/LeaseDetail";
import { getLeaseBook, getLeaseView } from "@/server/dal/leases";
import { requireMember } from "@/server/session";
import { TABS } from "@/lib/nav";

export const metadata = { title: "Lease detail" };

// LB-03/04/05. `leaseId` is the lease code (e.g. L-0001).
async function Body({ params }: { params: PageProps<"/leases/register/[leaseId]/[tab]">["params"] }) {
  const { leaseId, tab } = await params;
  const p = await requireMember("leases.view");
  const book = await getLeaseBook(p);
  const lease = book.ok ? book.data.register.find((l) => l.id === decodeURIComponent(leaseId)) : undefined;
  if (!lease || !(TABS.lease as readonly string[]).includes(tab)) notFound();
  const view = await getLeaseView(p, lease.id);
  return <LeaseDetail lease={lease} tab={tab} view={view.ok ? view.data : null} />;
}

export default function LeaseDetailPage({ params }: PageProps<"/leases/register/[leaseId]/[tab]">) {
  return <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body params={params} /></Suspense>;
}
