import { notFound } from "next/navigation";
import { LeaseDetail } from "@/components/organisms/leases/LeaseDetail";
import { getLeases } from "@/data/mock/index";
import { TABS } from "@/lib/nav";

export const metadata = { title: "Lease detail" };

export function generateStaticParams() {
  return getLeases().flatMap((l) => TABS.lease.map((tab) => ({ leaseId: l.id, tab })));
}

// LB-03/04/05.
export default async function LeaseDetailPage({ params }: PageProps<"/leases/register/[leaseId]/[tab]">) {
  const { leaseId, tab } = await params;
  const lease = getLeases().find((l) => l.id === leaseId);
  if (!lease || !(TABS.lease as readonly string[]).includes(tab)) notFound();
  return <LeaseDetail lease={lease} tab={tab} />;
}
