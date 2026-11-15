"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DataStep } from "@/components/organisms/ecl/DataStep";
import { StepSetup } from "@/components/organisms/ecl/StepSetup";
import type { CollateralType, Segment, Threshold } from "@/components/organisms/ecl/Setup";
import { StepCompute, StepReview, StepSignOff } from "@/components/organisms/ecl/Steps";
import { useEngineEvents } from "@/hooks/useEngineEvents";
import { maxStep, NEW_DRAFT, resetDraft, STEPS, useDraft, type Step } from "@/hooks/useRunDraft";
import { hydrate } from "@/lib/wizard-engine";

/**
 * Routes /ecl/runs/new/[step]. The run lives in the engine: `?run=<id>` (re)opens it and hydrates this screen from
 * the engine (so drafts follow the user across devices); `?new=1` starts fresh. Enforces the gate (can't skip
 * ahead of accepted data) and refreshes from live engine events.
 */
export type WizardSetup = { segments: Segment[]; collateral: CollateralType[]; thresholds: Threshold[] };

export function Wizard({ step, setup }: { step: Step; setup?: WizardSetup }) {
  const d = useDraft(), router = useRouter(), sp = useSearchParams();
  const idx = STEPS.indexOf(step);
  const [ready, setReady] = useState(() => !sp.get("run")); // with ?run= wait for the engine before gating
  useEffect(() => {
    const run = sp.get("run");
    if (run) { void hydrate(run).then((ok) => { setReady(true); if (!ok) router.replace("/ecl/runs/new/setup?new=1"); }); return; }
    if (sp.get("new") === "1" || (step === "setup" && (d.phase === "signed-off" || d.phase === "submitted"))) {
      resetDraft(NEW_DRAFT());
      if (sp.toString()) router.replace("/ecl/runs/new/setup");
    } else if (d.runId) void hydrate(d.runId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per open, not on every draft change
  }, [sp, router, step]);
  useEngineEvents((e) => { if (d.runId && e.runId === d.runId && e.type !== "validation") void hydrate(d.runId); });
  useEffect(() => {
    if (!ready) return;
    if (idx > 0 && !d.runId) router.replace("/ecl/runs/new/setup");
    else if (idx > maxStep(d)) router.replace(`/ecl/runs/new/${STEPS[maxStep(d)]}`);
  }, [ready, idx, d, router]);

  if (step === "setup") return <StepSetup setup={setup} />;
  if (step === "pd" || step === "lgd" || step === "ead") return <DataStep key={step} k={step} />;
  if (step === "review") return <StepReview />;
  if (step === "compute") return <StepCompute />;
  return <StepSignOff />;
}
