import { redirect } from "next/navigation";

export default async function Page(props: PageProps<"/platform/workspaces/[id]">) {
  const { id } = await props.params;
  redirect(`/platform/workspaces/${id}/summary`);
}
