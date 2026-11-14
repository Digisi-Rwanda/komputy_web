import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/organisms/auth/AuthCard";
import { MfaForm } from "@/components/organisms/auth/MfaForm";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Two-step verification", robots: { index: false } };

async function Form({ searchParams }: { searchParams: PageProps<"/sign-in/mfa">["searchParams"] }) {
  return <MfaForm next={one((await searchParams).next)} />;
}

export default function MfaPage({ searchParams }: PageProps<"/sign-in/mfa">) {
  return (
    <AuthCard icon="key" title="Enter your code" sub="Open your authenticator app for your Ledgerline account.">
      <Suspense fallback={<div className="skeleton h-48 rounded-card" />}><Form searchParams={searchParams} /></Suspense>
    </AuthCard>
  );
}
