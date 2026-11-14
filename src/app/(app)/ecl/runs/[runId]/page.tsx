import { redirect } from "next/navigation";
import { getRuns } from "@/data/mock/index";

export function generateStaticParams() {
  return getRuns().map((r) => ({ runId: r.id }));
}

export default async function Page(props: PageProps<"/ecl/runs/[runId]">) {
  const { runId } = await props.params;
  redirect(`/ecl/runs/${runId}/summary`);
}
