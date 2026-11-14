import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/organisms/auth/AuthCard";
import { WorkspacePicker } from "@/components/organisms/auth/WorkspacePicker";
import { signOut } from "@/lib/actions/auth";
import { one } from "@/lib/search";
import { listMyWorkspaces } from "@/server/dal/workspace";
import { requireUser } from "@/server/session";

export const metadata = { title: "Choose a workspace" };

// A3: every workspace the signed-in person belongs to.
async function Picker({ searchParams }: { searchParams: PageProps<"/select-workspace">["searchParams"] }) {
  const [p, q] = await Promise.all([requireUser(), searchParams]);
  const items = await listMyWorkspaces(p.userId);
  return (
    <AuthCard wide title={items.length ? "Choose a workspace" : "You're not in a workspace yet"} sub={`Signed in as ${p.email}`}>
      {one(q.error) === "suspended" && <p role="alert" className="mb-4 text-small text-negative">That workspace is suspended. Contact your account manager or choose another workspace.</p>}
      {one(q.error) === "not-a-member" && <p role="alert" className="mb-4 text-small text-negative">You&apos;re no longer a member of that workspace.</p>}
      {items.length ? <WorkspacePicker items={items.map((i) => ({ ...i, lastOpened: i.role }))} next={one(q.next) || "/home"} />
        : <p className="text-small text-fg-muted">Ask an administrator to invite you, or create a workspace for your company.</p>}
      <div className="mt-6 flex justify-between border-t border-line pt-4 text-small">
        <Link href="/new-workspace" className="text-link hover:underline">Create a new workspace</Link>
        <form action={signOut}><button type="submit" className="text-link hover:underline">Sign out</button></form>
      </div>
    </AuthCard>
  );
}

export default function SelectWorkspacePage({ searchParams }: PageProps<"/select-workspace">) {
  return <Suspense fallback={<div className="skeleton h-96 w-[640px] rounded-panel" />}><Picker searchParams={searchParams} /></Suspense>;
}
