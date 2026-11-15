import { redirect } from "next/navigation";

export default async function Page(props: PageProps<"/ecl/runs/[runId]">) {
  const { runId } = await props.params;
  redirect(`/ecl/runs/${runId}/summary`);
}
