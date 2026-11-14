// Changelog (P9). Newest first. `id` is the URL anchor (/updates#v1-3).
export type UpdateTag = "ECL" | "Leases" | "Platform";
export interface Update { id: string; version: string; title: string; date: string; tags: UpdateTag[]; summary: string; new: string[]; improved: string[]; fixed: string[]; note?: string; visual: "checks" | "matrix" | "calendar" | "launch" }

export const UPDATES: Update[] = [
  { id: "v1-3", version: "v1.3", title: "Reconciliation checks", date: "2026-11-03", tags: ["ECL", "Leases", "Platform"], visual: "checks", summary: "Seven reconciliation checks on every run.", new: ["Seven reconciliation checks on every run, tolerance 0.01", "Exceptions register by category; ECL capped at outstanding with a logged reason"], improved: ["PD validation is 3× faster on large workbooks"], fixed: ["Month gaps over year-end reported correctly"], note: "Engine v1.3.0 · methodology unchanged for PD" },
  { id: "v1-2", version: "v1.2", title: "PD-first validation", date: "2026-10-06", tags: ["ECL", "Leases", "Platform"], visual: "matrix", summary: "Validate PD before LGD and EAD.", new: ["Stricter validation for PD inputs, with clearer error messages and row samples"], improved: ["Performance on large portfolios"], fixed: ["Alias detection for “As At” reporting-month columns"] },
  { id: "v1-1", version: "v1.1", title: "Lease month-end close", date: "2026-09-08", tags: ["Leases", "Platform"], visual: "calendar", summary: "Close checklist with period lock.", new: ["Month-end close checklist with owners and period lock", "Confirm actual payments against schedules"], improved: ["Faster processing of adjustment entries"], fixed: [] },
  { id: "v1-0", version: "v1.0", title: "Ledgerline is live", date: "2026-08-04", tags: ["Platform"], visual: "launch", summary: "IFRS 9 and IFRS 16 in one workspace.", new: ["Expected Credit Loss and Lease Accounting in one secure, compliant platform"], improved: [], fixed: [] },
];
