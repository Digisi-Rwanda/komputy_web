import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { toneVariants, type Tone } from "@/components/atoms/Badge";
import type { RunStatus, ServiceState, Stage } from "@/types/domain";

/** Tinted pill with dot + word. Status is never colour alone. */
export function StatusPill({ tone = "neutral", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-micro font-medium whitespace-nowrap [&_svg]:size-3", toneVariants({ tone }), className)}>
      {icon ?? <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export const RUN_STATUS: Record<RunStatus, [Tone, string]> = {
  draft: ["neutral", "Draft"],
  validating: ["info", "Validating"],
  ready: ["info", "Ready to compute"],
  computing: ["info", "Computing"],
  failed: ["negative", "Failed"],
  "needs-review": ["warning", "Needs review"],
  returned: ["warning", "Returned"],
  "signed-off": ["positive", "Signed off"],
  archived: ["neutral", "Archived"],
};

export const SERVICE_STATE: Record<ServiceState, [Tone, string]> = {
  active: ["positive", "Active"],
  trial: ["warning", "Trial"],
  "trial-expired": ["negative", "Trial ended"],
  suspended: ["negative", "Suspended"],
  expired: ["neutral", "Expired"],
  requested: ["info", "Requested"],
  locked: ["neutral", "Not active"],
  "coming-soon": ["neutral", "Coming soon"],
};

export const RunStatusPill = ({ status }: { status: RunStatus }) => <StatusPill tone={RUN_STATUS[status][0]}>{RUN_STATUS[status][1]}</StatusPill>;
export const ServiceStatePill = ({ state }: { state: ServiceState }) => <StatusPill tone={SERVICE_STATE[state][0]}>{SERVICE_STATE[state][1]}</StatusPill>;

const STAGE_TONE: Record<Stage, Tone> = { 1: "positive", 2: "warning", 3: "negative" };
export const stageDot: Record<Stage, string> = { 1: "bg-stage-1", 2: "bg-stage-2", 3: "bg-stage-3" };

/** IFRS 9 stage, always labelled "Stage n". */
export const StagePill = ({ stage, className }: { stage: Stage; className?: string }) => <StatusPill tone={STAGE_TONE[stage]} className={className}>Stage {stage}</StatusPill>;
