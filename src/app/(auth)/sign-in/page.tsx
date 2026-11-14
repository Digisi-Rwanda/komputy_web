import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/organisms/auth/AuthCard";
import { SignInForm } from "@/components/organisms/auth/SignInForm";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Sign in", alternates: { canonical: "/sign-in" } };

async function Form({ searchParams }: { searchParams: PageProps<"/sign-in">["searchParams"] }) {
  const sp = await searchParams;
  const notice = one(sp["signed-out"]) ? "You've been signed out." : one(sp.expired) ? "Your session expired — sign in again to continue where you left off." : undefined;
  return <SignInForm next={one(sp.next)} notice={notice} />;
}

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <AuthCard title="Sign in" sub="Welcome back to Ledgerline.">
      <Suspense fallback={<div className="skeleton h-96 rounded-card" />}><Form searchParams={searchParams} /></Suspense>
    </AuthCard>
  );
}
