import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/atoms/Button";
import { AuthCard } from "@/components/organisms/auth/AuthCard";
import { Verified } from "@/components/organisms/auth/CheckEmail";
import { one } from "@/lib/search";
import { getWorkspace } from "@/server/dal/workspace";
import { getPrincipal } from "@/server/session";

export const metadata = { title: "Email verified" };

// AU5: Better Auth verifies the link, signs the person in, then redirects here (?verified=1, or ?error=… on failure).
async function Body({ searchParams }: { searchParams: PageProps<"/verify-email">["searchParams"] }) {
  const q = await searchParams;
  const p = one(q.verified) && !one(q.error) ? await getPrincipal() : null;
  if (!p) return (
    <AuthCard icon="x-circle" iconTone="negative" title="This link isn't valid" sub="It may have expired or already been used.">
      <Button asChild variant="secondary" className="w-full"><Link href="/verify-email-pending">Send a new link</Link></Button>
    </AuthCard>
  );
  const ws = p.tenantId ? await getWorkspace(p.tenantId) : null;
  return <AuthCard icon="check-circle" iconTone="positive" title="Email verified" sub={ws ? `Your workspace ${ws.name} is ready.` : "Your account is ready."}><Verified /></AuthCard>;
}

export default function VerifyPage({ searchParams }: PageProps<"/verify-email">) {
  return <Suspense fallback={<div className="skeleton h-80 w-[440px] rounded-panel" />}><Body searchParams={searchParams} /></Suspense>;
}
