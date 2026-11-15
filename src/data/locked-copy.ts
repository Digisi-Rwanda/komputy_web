// Locked-page copy per service (AC1). Falls back to service-page data for others.
import type { ServiceId } from "@/types/domain";

export const LOCKED_COPY: Partial<Record<ServiceId, { eyebrow: string; title: string; sub: string; ticks: string[]; price: string; trial: string; url: string }>> = {
  leases: {
    eyebrow: "Lease Accounting · IFRS 16",
    title: "Run lease accounting where your credit loss work already lives.",
    sub: "Register leases, calculate schedules, close the month and post journals.",
    ticks: ["IFRS 16 schedules, journals and disclosures", "Maker and checker approvals and month end close", "Same workspace, same team, same audit log"],
    price: "Included in Dual and Suite packages · from USD 450 / month",
    trial: "Trial: 10 active leases, 1 entity, 14 days. No card needed.",
    url: "komputy.com/leases",
  },
  ecl: {
    eyebrow: "Expected Credit Loss · IFRS 9",
    title: "Expected credit loss, signed off with evidence.",
    sub: "Upload PD, LGD and EAD data. Validate, compute and reconcile every run.",
    ticks: ["PD transition matrices and collateral aware LGD", "Seven reconciliation checks on every run", "Maker and checker sign off and full audit trail"],
    price: "Included in Single, Dual and Suite packages · from USD 1,200 / month",
    trial: "Trial: 3 runs, up to 5,000 loans per run, 14 days. No card needed.",
    url: "komputy.com/ecl",
  },
};

export const TRIAL_TERMS: Partial<Record<ServiceId, string[]>> = {
  leases: ["Length · 14 days", "Includes · 10 active leases, 1 entity, 1 close period", "Outputs · marked TRIAL", "After · data stays view only for 90 days"],
  ecl: ["Length · 14 days", "Includes · 3 runs, up to 5,000 loans per run", "Outputs · marked TRIAL", "After · data stays view only for 90 days"],
};
