import { StatusPill } from "@/components/atoms/StatusPill";
import type { ServiceState } from "@/types/domain";
import type { Tone } from "@/types/ui";

export const STATE: Record<ServiceState, [Tone, string]> = { active: ["positive", "Active"], trial: ["warning", "Trial"], "trial-expired": ["neutral", "Trial expired"], suspended: ["negative", "Suspended"], expired: ["neutral", "Expired"], requested: ["info", "Requested"], locked: ["neutral", "Locked"], "coming-soon": ["neutral", "Coming soon"] };
export const SvcPill = ({ svc, state }: { svc: string; state: ServiceState }) => <StatusPill tone={STATE[state][0]}>{svc} {STATE[state][1]}</StatusPill>;
export const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
