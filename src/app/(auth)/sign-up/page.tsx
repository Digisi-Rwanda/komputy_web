import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, WhatYouGet } from "@/components/organisms/auth/AuthCard";
import { SignUpForm } from "@/components/organisms/auth/SignUpForm";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Start your free trial", description: "14 days free, sample data included, no card required.", alternates: { canonical: "/sign-up" } };

async function Form({ searchParams }: { searchParams: PageProps<"/sign-up">["searchParams"] }) {
  return <SignUpForm preselect={one((await searchParams).service)} />;
}

export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return (
    <WhatYouGet>
      <AuthCard title="Start your free trial" sub="Three short steps. No card required.">
        <Suspense fallback={<div className="skeleton h-96 rounded-card" />}><Form searchParams={searchParams} /></Suspense>
      </AuthCard>
    </WhatYouGet>
  );
}
