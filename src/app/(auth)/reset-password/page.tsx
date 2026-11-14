import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "@/components/organisms/auth/ResetForms";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

async function Form({ searchParams }: { searchParams: PageProps<"/reset-password">["searchParams"] }) {
  return <ResetForm token={one((await searchParams).token)} />;
}
export default function ResetPage({ searchParams }: PageProps<"/reset-password">) {
  return <Suspense fallback={<div className="skeleton h-96 w-[440px] rounded-panel" />}><Form searchParams={searchParams} /></Suspense>;
}
