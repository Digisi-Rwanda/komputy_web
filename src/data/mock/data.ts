// One consistent fictional dataset (Kivu Commercial Bank, Q3 2026) matching the approved image set.
import type { AuditEvent, Member, Notification, Run, SegmentResult, Workspace } from "@/types/domain";

export const TODAY = "2026-11-12";

export const workspaces: Workspace[] = [
  {
    id: "ws-kivu", name: "Kivu Commercial Bank", legalName: "Kivu Commercial Bank PLC", initial: "K", country: "Rwanda", currency: "USD",
    entitlements: [
      { service: "ecl", state: "active", quota: { used: 7, limit: 20, unit: "runs / month" } },
      { service: "leases", state: "trial", trialEndsAt: "2026-11-16", quota: { used: 8, limit: 10, unit: "leases" } },
      { service: "tax", state: "coming-soon" },
    ],
  },
  { id: "ws-lakeshore", name: "Lakeshore Microfinance", legalName: "Lakeshore Microfinance Ltd", initial: "L", country: "Uganda", currency: "USD", entitlements: [{ service: "ecl", state: "active" }] },
  { id: "ws-northgate", name: "Northgate Leasing", legalName: "Northgate Leasing Ltd", initial: "N", country: "Kenya", currency: "USD", entitlements: [{ service: "leases", state: "trial", trialEndsAt: "2026-11-13" }] },
];

export const me: Member = {
  id: "u-aline", name: "Aline Mugisha", initials: "AM", email: "a.mugisha@kivubank.rw", title: "Head of Credit Risk",
  workspaceRole: "owner", ecl: "analyst", leases: "preparer", mfa: true, status: "active", lastActive: "Now",
};

export const members: Member[] = [
  me,
  { id: "u-jean", name: "Jean Habimana", initials: "JH", email: "j.habimana@kivubank.rw", workspaceRole: "admin", ecl: "reviewer", leases: "reviewer", mfa: true, status: "active", lastActive: "2 h ago" },
  { id: "u-eric", name: "Eric Uwase", initials: "EU", email: "e.uwase@kivubank.rw", workspaceRole: "member", ecl: "analyst", leases: "none", mfa: false, status: "active", lastActive: "Yesterday" },
  { id: "u-grace", name: "Grace Ineza", initials: "GI", email: "g.ineza@kivubank.rw", workspaceRole: "member", ecl: "viewer", leases: "preparer", mfa: false, status: "active", lastActive: "3 days ago" },
  { id: "u-patrick", name: "Patrick Nkurunziza", initials: "PN", email: "p.nkurunziza@kivubank.rw", workspaceRole: "member", ecl: "viewer", leases: "none", mfa: false, status: "invited", lastActive: "—" },
  { id: "u-divine", name: "Divine Mukamana", initials: "DM", email: "d.mukamana@kivubank.rw", workspaceRole: "member", ecl: "viewer", leases: "poster", mfa: true, status: "disabled", lastActive: "12 Oct" },
];

const q3: Run = {
  id: "RUN-0142", name: "Q3 2026 provisioning", reportingDate: "2026-09-30", status: "signed-off", engine: "v1.3.0", currency: "USD",
  totalEcl: 12846210.55, exposure: 556104882.4, coverage: 0.0231, deltaVsPrior: 0.042,
  stages: [
    { stage: 1, ecl: 2104880.12, exposure: 397058434.0, share: 0.714 },
    { stage: 2, ecl: 3912004.9, exposure: 116782025.3, share: 0.21 },
    { stage: 3, ecl: 6829325.53, exposure: 42264423.1, share: 0.076 },
  ],
  loans: 48312, exceptions: 64, checksPassed: 7, createdBy: "Aline Mugisha", reviewer: "Jean Habimana", signedOffAt: "2026-10-02T17:02:00Z", updatedAt: "2026-10-02T17:02:00Z",
};
const inProgress = { totalEcl: 0, deltaVsPrior: 0, exceptions: 0, checksPassed: 0, signedOffAt: undefined };

// Run history (E3/E4). Newest first.
export const runs: Run[] = [
  { ...q3, ...inProgress, id: "RUN-0144", name: "Nov 2026 draft", reportingDate: "2026-11-30", status: "draft", engine: "v1.3.0", createdBy: "Eric Uwase", updatedAt: "2026-11-12T08:00:00Z", step: 1, stepLabel: "Setup" },
  { ...q3, ...inProgress, id: "RUN-0143", name: "Oct 2026 month-end", reportingDate: "2026-10-31", status: "validating", createdBy: "Eric Uwase", updatedAt: "2026-11-12T09:40:00Z", step: 4, stepLabel: "EAD validating" },
  q3,
  { ...q3, id: "RUN-0141", name: "Q3 2026 — rerun with new LGD", status: "needs-review", totalEcl: 12912004.1, deltaVsPrior: 0.047, createdBy: "Jean Habimana", reviewer: "Aline Mugisha", signedOffAt: undefined, updatedAt: "2026-11-12T08:00:00Z" },
  { ...q3, id: "RUN-0140", name: "Q3 2026 — collateral fix", totalEcl: 12870552.81, deltaVsPrior: 0.044, createdBy: "Eric Uwase", signedOffAt: "2026-10-01T15:00:00Z", updatedAt: "2026-10-01T15:00:00Z" },
  { ...q3, ...inProgress, id: "RUN-0136", name: "Stress — SME downturn", status: "failed", createdBy: "Jean Habimana", updatedAt: "2026-09-20T11:00:00Z", step: 6, stepLabel: "Compute", failure: { message: "EAD step failed: 14 loans have Maturity Date before First Payment Date.", ref: "job_01HG4K…7Q" } },
  { ...q3, id: "RUN-0137", name: "Aug 2026 month-end", reportingDate: "2026-08-31", engine: "v1.2.4", loans: 47905, totalEcl: 12331870.44, deltaVsPrior: 0.019, exposure: 548900000, coverage: 0.0225, signedOffAt: "2026-09-03T10:00:00Z", updatedAt: "2026-09-03T10:00:00Z" },
  { ...q3, id: "RUN-0134", name: "Jul 2026 month-end", reportingDate: "2026-07-31", engine: "v1.2.4", loans: 47410, totalEcl: 12104330.02, deltaVsPrior: 0.012, signedOffAt: "2026-08-04T10:00:00Z", updatedAt: "2026-08-04T10:00:00Z" },
  { ...q3, id: "RUN-0131", name: "Q2 2026 — reviewer edits", reportingDate: "2026-06-30", status: "needs-review", engine: "v1.2.4", loans: 46220, totalEcl: 11990120.33, deltaVsPrior: 0.008, createdBy: "Jean Habimana", signedOffAt: undefined, updatedAt: "2026-07-07T10:00:00Z" },
  { ...q3, id: "RUN-0128", name: "Q2 2026 provisioning", reportingDate: "2026-06-30", engine: "v1.2.4", loans: 46220, totalEcl: 11893450.12, deltaVsPrior: 0.006, signedOffAt: "2026-07-03T10:00:00Z", updatedAt: "2026-07-03T10:00:00Z" },
  { ...q3, id: "RUN-0120", name: "Q1 2026 provisioning", reportingDate: "2026-03-31", status: "archived", engine: "v1.2.0", loans: 44870, totalEcl: 11520330.4, deltaVsPrior: 0.01, signedOffAt: "2026-04-04T10:00:00Z", updatedAt: "2026-04-04T10:00:00Z" },
];

export const run = (id: string) => runs.find((r) => r.id === id);

export const segments: SegmentResult[] = [
  { segment: "Retail", exposure: 241200000, ecl: 5812440.2, coverage: 0.0241, delta: 0.031 },
  { segment: "SME", exposure: 118900000, ecl: 3401220.1, coverage: 0.0286, delta: 0.098 },
  { segment: "Corporate", exposure: 132600000, ecl: 2160904.75, coverage: 0.0163, delta: -0.012 },
  { segment: "Mortgage", exposure: 63400000, ecl: 1471645.5, coverage: 0.0232, delta: 0.004 },
];

/** Monthly ECL trend by stage, USD */
export const eclTrend = [
  { month: "Mar", s1: 1.95e6, s2: 3.35e6, s3: 6.02e6 },
  { month: "Apr", s1: 1.98e6, s2: 3.41e6, s3: 6.1e6 },
  { month: "May", s1: 2.01e6, s2: 3.5e6, s3: 6.2e6 },
  { month: "Jun", s1: 2.05e6, s2: 3.62e6, s3: 6.31e6 },
  { month: "Jul", s1: 2.07e6, s2: 3.7e6, s3: 6.45e6 },
  { month: "Aug", s1: 2.09e6, s2: 3.78e6, s3: 6.46e6 },
  { month: "Sep", s1: 2.1e6, s2: 3.91e6, s3: 6.83e6 },
  { month: "Oct", s1: 2.11e6, s2: 3.95e6, s3: 6.95e6 },
];

/** ECL movement Aug -> Sep (waterfall), USD */
export const movement = [
  { label: "Aug ECL", value: 12331870.44, kind: "total" as const },
  { label: "New loans", value: 420000 },
  { label: "Repayments", value: -180000 },
  { label: "Stage 1→2", value: 390000 },
  { label: "Stage 2→3", value: 210000 },
  { label: "Cures", value: -120000 },
  { label: "LGD change", value: -205659.89 },
  { label: "Sep ECL", value: 12846210.55, kind: "total" as const },
];

/** Pooled transition matrix, Retail, Jan–Sep 2026 */
export const pdMatrix = {
  rows: ["S1", "S2", "S3"],
  cols: ["S1", "S2", "S3", "Offbooks"],
  values: [
    [0.9412, 0.0391, 0.0042, 0.0155],
    [0.2105, 0.642, 0.1203, 0.0272],
    [0.031, 0.0498, 0.8901, 0.0291],
  ],
};

export { register as leases } from "@/data/mock/leases";

export const notifications: Notification[] = [
  { id: "n1", kind: "runs", title: "RUN-0141 is ready for your sign-off", meta: "Submitted by Jean Habimana · 12 min ago", at: "2026-11-12T09:02:00Z", read: false, action: "Review" },
  { id: "n2", kind: "leases", title: "Lease LSE-0087 approved", meta: "Jean Habimana · 1 h ago", at: "2026-11-12T08:14:00Z", read: false },
  { id: "n3", kind: "access", title: "Your Lease Accounting trial ends in 4 days", meta: "8 of 10 leases used", at: "2026-11-12T07:00:00Z", read: false, action: "Request access" },
  { id: "n4", kind: "runs", title: "RUN-0136 failed at reconciliation", meta: "11 Nov 2026 · 16:32", at: "2026-11-11T16:32:00Z", read: true },
  { id: "n5", kind: "workspace", title: "Patrick Nkurunziza joined the workspace", meta: "11 Nov 2026 · 14:17", at: "2026-11-11T14:17:00Z", read: true },
];

export const audit: AuditEvent[] = [
  { at: "2026-11-11T09:14:02Z", actor: "Aline Mugisha", initials: "AM", action: "Signed off run", object: "RUN-0142", service: "ECL" },
  { at: "2026-11-11T08:51:40Z", actor: "Jean Habimana", initials: "JH", action: "Approved lease", object: "LSE-0087", service: "Leases" },
  { at: "2026-11-10T17:22:09Z", actor: "Eric Uwase", initials: "EU", action: "Uploaded PD data", object: "RUN-0143 · PD_Jan-Oct.xlsx", service: "ECL" },
  { at: "2026-11-10T16:05:33Z", actor: "Aline Mugisha", initials: "AM", action: "Changed role", object: "Eric Uwase: Viewer → Analyst", service: "Workspace" },
  { at: "2026-11-09T15:30:00Z", actor: "System", initials: "SY", action: "Trial started", object: "Lease Accounting · 14 days", service: "Leases" },
];

/** Lease Accounting headline figures for Home (USD). */
export const leaseSummary = { liability: 8_360_000, rou: 7_910_000, close: { label: "October close", step: 3, of: 6, next: "Confirm actual payments" } };

export interface AttentionItem { id: string; service: "ecl" | "leases" | "workspace"; title: string; meta: string; status: [import("@/types/ui").Tone, string]; age: string; href: string; action: string }

/** Unified inbox for Home (blueprint §10.4). */
export const attention: AttentionItem[] = [
  { id: "a1", service: "ecl", title: "RUN-0141 awaiting your sign-off", meta: "Q3 2026 — rerun with new LGD · submitted by Jean Habimana", status: ["warning", "Needs review"], age: "2 h", href: "/ecl/runs/RUN-0141/summary", action: "Review" },
  { id: "a2", service: "ecl", title: "LGD validation has 2 warnings", meta: "RUN-0143 · Oct 2026 month-end", status: ["warning", "Warning"], age: "5 h", href: "/ecl/runs/new/lgd", action: "Open" },
  { id: "a3", service: "leases", title: "Lease LSE-0142 awaiting approval", meta: "Butare branch · Eric Uwase", status: ["info", "Submitted"], age: "1 d", href: "/leases/inbox", action: "Review" },
  { id: "a4", service: "leases", title: "October close: confirm actual payments", meta: "Step 3 of 6 · due 3 Nov", status: ["neutral", "Due 3 Nov"], age: "2 d", href: "/leases/close", action: "Continue" },
  { id: "a5", service: "workspace", title: "Invite pending", meta: "p.nkurunziza@kivubank.rw · Analyst", status: ["neutral", "Pending"], age: "3 d", href: "/admin/members", action: "Resend" },
];

// ECL Setup (E5–E8).
export interface Segment { name: string; active: boolean; loans: number; source: "manual" | "data"; firstSeen?: string; updated: string }
export const segmentsSetup: Segment[] = [
  { name: "Retail", active: true, loans: 31204, source: "manual", updated: "2026-03-12" },
  { name: "SME", active: true, loans: 9880, source: "manual", updated: "2026-03-12" },
  { name: "Corporate", active: true, loans: 1012, source: "manual", updated: "2026-03-12" },
  { name: "Mortgage", active: true, loans: 6216, source: "data", firstSeen: "RUN-0128", updated: "2026-07-03" },
  { name: "Agriculture", active: false, loans: 0, source: "data", firstSeen: "RUN-0131", updated: "2026-07-07" },
];
export interface CollateralType { name: string; haircut: number; months: number; usedUsd: number; active: boolean }
export const collateralSetup: CollateralType[] = [
  { name: "Residential property", haircut: 0.35, months: 18, usedUsd: 182.4e6, active: true },
  { name: "Commercial property", haircut: 0.45, months: 24, usedUsd: 96.1e6, active: true },
  { name: "Vehicles", haircut: 0.5, months: 12, usedUsd: 21.7e6, active: true },
  { name: "Cash deposits", haircut: 0, months: 0, usedUsd: 8.9e6, active: true },
  { name: "Equipment", haircut: 0.6, months: 12, usedUsd: 4.3e6, active: true },
];
export interface Threshold { id: string; label: string; description: string; value: number; def: number; unit: "months" | "count" | "percent"; group: string }
export const thresholds: Threshold[] = [
  { id: "PD-04", label: "Maximum month gap", description: "Largest allowed gap between consecutive reporting months.", value: 2, def: 2, unit: "months", group: "PD data" },
  { id: "PD-05", label: "Minimum transitions per segment", description: "Fewer transitions make the matrix unstable.", value: 500, def: 500, unit: "count", group: "PD data" },
  { id: "PD-06", label: "Maximum share of Offbooks", description: "Share of loans leaving the book between months.", value: 0.15, def: 0.2, unit: "percent", group: "PD data" },
  { id: "EC-14", label: "Maximum duplicate Loan IDs", description: "Per reporting month, across all sheets.", value: 0, def: 0, unit: "count", group: "Exposure data" },
  { id: "EC-18", label: "Minimum months of history", description: "Months of PD snapshots required before computing.", value: 6, def: 6, unit: "months", group: "Exposure data" },
];
