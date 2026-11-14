"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { DataStep } from "@/components/organisms/ecl/DataStep";
import { StepSetup } from "@/components/organisms/ecl/StepSetup";
import { StepCompute, StepReview, StepSignOff } from "@/components/organisms/ecl/Steps";
import { maxStep, NEW_DRAFT, resetDraft, STEPS, useDraft, type Step } from "@/hooks/useRunDraft";

/** Routes /ecl/runs/new/[step]. Enforces the gate (can't skip ahead of accepted data) and handles ?sample=1 / ?from=RUN-x / ?new=1. */
export function Wizard({ step }: { step: Step }) {
  const d = useDraft(), router = useRouter(), sp = useSearchParams();
  const idx = STEPS.indexOf(step);
  useEffect(() => {
    const from = sp.get("from");
    if (sp.get("sample") === "1") {
      resetDraft({ ...NEW_DRAFT(), id: "RUN-S001", name: "Sample — Q1 2026", reportingDate: "2026-04-30", sample: true, files: { pd: { status: "report", name: "SAMPLE_PD.xlsx", sizeMb: 0.4, outcome: "warnings" }, lgd: { status: "report", name: "SAMPLE_LGD.xlsx", sizeMb: 0.1, outcome: "warnings" }, ead: { status: "report", name: "SAMPLE_EAD.xlsx", sizeMb: 0.2, outcome: "warnings" } } });
      router.replace("/ecl/runs/new/pd");
    } else if (from || sp.get("new") === "1" || (step === "setup" && d.phase === "signed-off")) {
      resetDraft({ ...NEW_DRAFT(), ...(from ? { name: `Copy of ${from}`, description: `Duplicated from ${from}` } : {}) });
      if (sp.toString()) router.replace("/ecl/runs/new/setup");
    }
  }, [sp, router, step, d.phase]);
  useEffect(() => { if (idx > maxStep(d)) router.replace(`/ecl/runs/new/${STEPS[maxStep(d)]}`); }, [idx, d, router]);

  if (step === "setup") return <StepSetup />;
  if (step === "pd" || step === "lgd" || step === "ead") return <DataStep key={step} k={step} />;
  if (step === "review") return <StepReview />;
  if (step === "compute") return <StepCompute />;
  return <StepSignOff />;
}
