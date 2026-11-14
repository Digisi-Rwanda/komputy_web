import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, WhatYouGet } from "@/components/organisms/auth/AuthCard";
import { CheckEmail } from "@/components/organisms/auth/CheckEmail";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Check your inbox", robots: { index: false } };

async function Body({ searchParams }: { searchParams: PageProps<"/verify-email-pending">["searchParams"] }) {
  const email = one((await searchParams).email).slice(0, 200);
  return (
    <AuthCard icon="mail" title="Check your inbox" sub={<>We sent a link to <span className="text-fg">{email || "your email"}</span>. It expires in 24 hours.</>}>
      <CheckEmail email={email} />
    </AuthCard>
  );
}

export default function VerifyPendingPage({ searchParams }: PageProps<"/verify-email-pending">) {
  return <WhatYouGet><Suspense fallback={<div className="skeleton h-96 w-[440px] rounded-panel" />}><Body searchParams={searchParams} /></Suspense></WhatYouGet>;
}
