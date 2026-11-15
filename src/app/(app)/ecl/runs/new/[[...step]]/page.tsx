import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Wizard } from "@/components/organisms/ecl/Wizard";
import { STEPS, type Step } from "@/data/wizard-steps";
import { getEclSetup } from "@/server/dal/engine";
import { requireMember } from "@/server/session";

export const metadata: Metadata = { title: "New run" };

// New run wizard (blueprint §11.4, W1-W17). Params are read inside Suspense so navigation stays instant.
export default function NewRunPage({ params }: PageProps<"/ecl/runs/new/[[...step]]">) {
  return <Suspense fallback={<div className="skeleton h-[480px] rounded-panel" />}><Load params={params} /></Suspense>;
}

async function Load({ params }: { params: PageProps<"/ecl/runs/new/[[...step]]">["params"] }) {
  const seg = (await params).step?.[0] ?? "setup";
  if (!(STEPS as readonly string[]).includes(seg)) notFound();
  const step = seg as Step;
  const p = await requireMember("ecl.prepare");
  const setup = step === "setup" ? await getEclSetup(p) : null;
  return <Wizard step={step} setup={setup ? { segments: setup.segments, collateral: setup.collateral, thresholds: setup.thresholds } : undefined} />;
}
