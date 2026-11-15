import { redirect } from "next/navigation";

export default async function Page(props: PageProps<"/leases/register/[leaseId]">) {
  const { leaseId } = await props.params;
  redirect(`/leases/register/${leaseId}/summary`);
}
