import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/organisms/PageHeader";
import { SampleChooser, SampleRun } from "@/components/organisms/onboarding/SampleRun";
import { one } from "@/lib/search";

export const metadata: Metadata = { title: "Try with sample data" };

async function Body({ searchParams }: { searchParams: PageProps<"/ecl/sample">["searchParams"] }) {
  if (one((await searchParams).run)) return <SampleRun />;
  return (
    <>
      <PageHeader crumbs={[{ label: "Expected Credit Loss", href: "/ecl" }, { label: "Get started" }]} title="Run your first calculation" description="Try a full run on sample data, or start with your own files." />
      <SampleChooser />
    </>
  );
}

// O4: sample-data entry (chooser) and run (?run=1).
export default function SamplePage({ searchParams }: PageProps<"/ecl/sample">) {
  return <Suspense fallback={<div className="skeleton h-96 rounded-panel" />}><Body searchParams={searchParams} /></Suspense>;
}
