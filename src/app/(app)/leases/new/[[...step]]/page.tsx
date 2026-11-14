import { notFound } from "next/navigation";
import { NewLease } from "@/components/organisms/leases/NewLease";
import { LEASE_WIZARD_STEPS } from "@/lib/nav";

export const metadata = { title: "New lease" };

export function generateStaticParams() {
  return [{ step: [] }, ...LEASE_WIZARD_STEPS.map((s) => ({ step: [s] }))];
}

// LB-01/02.
export default async function NewLeasePage({ params }: PageProps<"/leases/new/[[...step]]">) {
  const s = (await params).step?.[0] ?? "contract";
  const step = LEASE_WIZARD_STEPS.find((x) => x === s);
  if (!step) notFound();
  return <NewLease step={step} />;
}
