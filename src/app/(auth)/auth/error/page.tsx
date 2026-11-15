import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/atoms/Button";
import type { IconName } from "@/components/atoms/Icon";
import { AuthCard } from "@/components/organisms/auth/AuthCard";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Sign in problem", robots: { index: false } };

const REASONS: Record<string, { icon: IconName; tone?: "warning" | "negative"; title: string; sub: string; action: [string, string] }> = {
  "session-expired": { icon: "clock", tone: "warning", title: "Session expired", sub: "Please sign in again to continue where you left off.", action: ["Sign in", "/sign-in?expired=1"] },
  disabled: { icon: "lock", tone: "negative", title: "Account disabled", sub: "Your administrator disabled this account. Contact Aline Mugisha.", action: ["Back to sign in", "/sign-in"] },
  suspended: { icon: "alert", tone: "warning", title: "Workspace suspended", sub: "You can sign in and export, but not upload.", action: ["Continue view only", "/home"] },
  "sso-not-configured": { icon: "key", title: "SSO not configured", sub: "SSO isn't set up for your domain. Sign in with your password instead.", action: ["Sign in with password", "/sign-in"] },
};

async function Body({ searchParams }: { searchParams: PageProps<"/auth/error">["searchParams"] }) {
  const sp = await searchParams;
  const r = REASONS[one(sp.reason)];
  if (r) return <AuthCard icon={r.icon} iconTone={r.tone} title={r.title} sub={r.sub}><Button asChild size="lg" className="w-full"><Link href={r.action[1]}>{r.action[0]}</Link></Button></AuthCard>;
  const ref = one(sp.ref).replace(/[^\w-]/g, "").slice(0, 40) || "auth_unknown";
  return (
    <AuthCard icon="x-circle" iconTone="negative" title="Something went wrong signing you in" sub={<>Your data is safe. <span className="block pt-2 font-mono text-micro">Ref: {ref}</span></>}>
      <Button asChild size="lg" className="w-full"><Link href="/sign-in">Try again</Link></Button>
    </AuthCard>
  );
}

export default function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  return <Suspense fallback={<div className="skeleton h-80 w-[440px] rounded-panel" />}><Body searchParams={searchParams} /></Suspense>;
}
