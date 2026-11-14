import { redirect } from "next/navigation";
import { getLeases } from "@/data/mock/index";

export function generateStaticParams() {
  return getLeases().map((l) => ({ leaseId: l.id }));
}

export default async function Page(props: PageProps<"/leases/register/[leaseId]">) {
  const { leaseId } = await props.params;
  redirect(`/leases/register/${leaseId}/summary`);
}
