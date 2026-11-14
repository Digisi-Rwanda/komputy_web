import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Wizard } from "@/components/organisms/ecl/Wizard";
import { STEPS, type Step } from "@/data/wizard-steps";

export const metadata: Metadata = { title: "New run" };
export function generateStaticParams() { return [{ step: [] }, ...STEPS.map((s) => ({ step: [s] }))]; }

// New run wizard (blueprint §11.4, W1–W17).
export default async function NewRunPage({ params }: PageProps<"/ecl/runs/new/[[...step]]">) {
  const seg = (await params).step?.[0] ?? "setup";
  if (!(STEPS as readonly string[]).includes(seg)) notFound();
  return <Suspense fallback={<div className="skeleton h-[480px] rounded-panel" />}><Wizard step={seg as Step} /></Suspense>;
}
