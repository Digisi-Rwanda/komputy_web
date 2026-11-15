// Lease Accounting mock data (LA-LC). Figures tie: liability total 8,362,410.18 (Oct 2026).
import type { Lease } from "@/types/domain";

const E = "Kivu Commercial Bank Plc";
export const register: Lease[] = [
  { id: "LSE-0087", name: "Kigali Heights, Floor 4 office", counterparty: "Kigali Heights Properties", assetClass: "Property", entity: E, start: "2027-01-01", end: "2029-12-31", liability: 24868.52, rouAsset: 24868.52, rate: 0.1, status: "approved", createdBy: "Eric Uwase" },
  { id: "LSE-0142", name: "Nyarutarama branch", counterparty: "Nyarutarama Estates", assetClass: "Property", entity: E, start: "2026-11-01", end: "2031-10-31", liability: 412550, rouAsset: 418050, rate: 0.095, status: "submitted", createdBy: "Eric Uwase" },
  { id: "LSE-0118", name: "Fleet, 12 Toyota Hilux", counterparty: "Northgate Leasing", assetClass: "Vehicles", entity: E, start: "2025-03-01", end: "2029-02-28", liability: 286410.76, rouAsset: 279880.4, rate: 0.095, status: "approved", createdBy: "Grace Ineza" },
  { id: "LSE-0101", name: "Data centre racks", counterparty: "Volta IT Rentals", assetClass: "IT equipment", entity: E, start: "2024-07-01", end: "2027-06-30", liability: 98204.3, rouAsset: 95010.2, rate: 0.105, status: "modified", createdBy: "Eric Uwase" },
  { id: "LSE-0076", name: "Musanze branch", counterparty: "Virunga Properties", assetClass: "Property", entity: E, start: "2022-01-01", end: "2026-12-31", liability: 18920.11, rouAsset: 17880.5, rate: 0.09, status: "expiring", createdBy: "Grace Ineza" },
  { id: "LSE-0133", name: "ATM site, Kimironko", counterparty: "City Mall Rwanda", assetClass: "Branch ATMs", entity: E, start: "2026-02-01", end: "2031-01-31", liability: 61880, rouAsset: 60120, rate: 0.1, status: "approved", createdBy: "Eric Uwase" },
  { id: "LSE-0012", name: "Head office, floors 2-3", counterparty: "Kigali Heights Properties", assetClass: "Property", entity: E, start: "2021-01-01", end: "2030-12-31", liability: 3104220.98, rouAsset: 2980330.12, rate: 0.085, status: "approved", createdBy: "Aline Mugisha" },
  { id: "LSE-0139", name: "Laptops refresh 2026", counterparty: "Volta IT Rentals", assetClass: "IT equipment", entity: E, status: "draft", createdBy: "Eric Uwase" },
  { id: "LSE-0058", name: "Rubavu branch", counterparty: "Lake Kivu Holdings", assetClass: "Property", entity: E, start: "2020-04-01", end: "2026-03-31", liability: 0, rouAsset: 0, rate: 0.09, status: "terminated", createdBy: "Aline Mugisha" },
  { id: "LSE-0121", name: "Generator, Huye", counterparty: "Northgate Leasing", assetClass: "Property", entity: E, start: "2026-05-01", end: "2027-04-30", status: "approved", exempt: "low-value", createdBy: "Grace Ineza" },
];

export const overview = {
  liability: 8362410.18, rou: 7904115.62, current: 1612880.4, nonCurrent: 6749529.78, due30: 214600, due30Count: 11, expiring12: 9, active: 142, entities: 3, deltaVsSep: -0.007,
  byClass: [["Property", 6102330.1], ["Vehicles", 1204880], ["IT equipment", 655200.08], ["Branch ATMs", 400000]] as [string, number][],
  rollForward: [{ label: "Opening", value: 8420118.3, kind: "total" as const }, { label: "Additions", value: 1104200 }, { label: "Interest", value: 392880.15 }, { label: "Payments", value: -1624120 }, { label: "Modifications", value: 69331.73 }, { label: "Closing", value: 8362410.18, kind: "total" as const }],
  expiries: [["LSE-0076", "Musanze branch", "Virunga Properties", "2026-12-31", 18920.11], ["LSE-0101", "Data centre racks", "Volta IT Rentals", "2027-06-30", 98204.3], ["LSE-0121", "Generator, Huye", "Northgate Leasing", "2027-04-30", 0]] as [string, string, string, string, number][],
};

export type SetupStatus = "approved" | "pending" | "draft" | "not-started";
export const setupSteps: { id: string; label: string; status: SetupStatus }[] = [
  { id: "entity", label: "Entity", status: "approved" },
  { id: "gl", label: "GL mapping", status: "approved" },
  { id: "periods", label: "Periods", status: "approved" },
  { id: "policies", label: "Policies", status: "draft" },
  { id: "rates", label: "Rate curves", status: "pending" },
];
export const glMapping = [["ROU asset: cost", "1610-100", "Right-of-use assets"], ["ROU asset: accumulated depreciation", "1610-900", "Accumulated depreciation"], ["Lease liability: current", "2410-100", "Lease liability current"], ["Lease liability: non-current", "2410-200", "Lease liability non-current"], ["Interest expense", "7110-300", "Interest on leases"], ["Depreciation expense", "6420-100", "Depreciation ROU"], ["Short-term / low-value expense", "6430-100", "Lease expense exempt"], ["Cash / payables clearing", "2010-500", "Payables clearing"]];
export const rateCurve = [[1, 0.0825], [2, 0.089], [3, 0.095], [5, 0.1], [7, 0.104], [10, 0.1075]] as [number, number][];

export interface InboxItem { id: string; type: "lease" | "setup" | "event" | "journal"; title: string; meta: string; age: string; by: string; due?: boolean; lease?: string }
export const inbox: InboxItem[] = [
  { id: "i1", type: "lease", title: "New lease · Nyarutarama branch", meta: "LSE-0142 · Eric Uwase · liability 412,550.00", age: "2 h", by: "Eric Uwase", lease: "LSE-0142" },
  { id: "i2", type: "setup", title: "Setup change · Rate curve Oct 2026", meta: "6 tenors changed · Eric Uwase", age: "1 d", by: "Eric Uwase" },
  { id: "i3", type: "event", title: "Event · Extension LSE-0087", meta: "+2 years · Δ liability +25,049.36", age: "3 h", by: "Eric Uwase", lease: "LSE-0087" },
  { id: "i4", type: "journal", title: "Journal batch · JB-2026-10", meta: "Oct 2026 close · 1,284 lines · balanced", age: "30 min", by: "Aline Mugisha", due: true },
];
export const mySubmissions: InboxItem[] = [{ id: "s1", type: "lease", title: "New lease · Laptops refresh 2026", meta: "LSE-0139 · returned by Jean Habimana", age: "1 d", by: "Jean Habimana", lease: "LSE-0139" }];

export const imports = [["IMP-0031", "Branches_2026.xlsx", 48, "needs-fixing", "Eric Uwase", "1 d"], ["IMP-0030", "Vehicles_Q3.csv", 12, "committed", "Eric Uwase", "3 Oct"], ["IMP-0029", "Old_leases.xlsx", 52, "cancelled", "Aline Mugisha", "28 Sep"]] as const;
export const importMapping = [["Lease Ref", "Lease ID", "LSE-0087", true], ["Landlord", "Counterparty", "Kivu Real Estate", true], ["Start", "Commencement date", "1 Jan 2027", false], ["Expiry", "End date", "31 Dec 2031", false], ["Rent", "Payment amount", "10,000.00", false], ["Freq", "Frequency", "Annual", false], ["IBR", "Rate (%)", "0.095", false], ["Branch", "Location", "Nyarutarama", false], ["Notes", "Ignore", "-", false]] as const;
export const importErrors = [[7, "End date before commencement"], [19, "Unknown counterparty “Kivu Props Ltd”: create or map"], [33, "Duplicate of LSE-0076"]] as const;

export const closeSummary = { liability: 8362410.18, interest: 69412.3, depreciation: 101233.84, payments: 412600 };
export const payments = [
  { lease: "LSE-0118", name: "Northgate Leasing", due: "2026-10-31", scheduled: 24500, actual: 24000 },
  { lease: "LSE-0120", name: "Kivu Commercial", due: "2026-10-31", scheduled: 18000, actual: 18000 },
  { lease: "LSE-0121", name: "Lakeshore Microfinance", due: "2026-10-31", scheduled: 12450, actual: 12450 },
  { lease: "LSE-0133", name: "City Mall Rwanda", due: "2026-10-31", scheduled: 1250, actual: 1250 },
];

export const batches = [
  { id: "JB-2026-10", period: "Oct 2026", lines: 1284, total: 583246.14, status: "approved" as const, erp: "" },
  { id: "JB-2026-09", period: "Sep 2026", lines: 1270, total: 579880.02, status: "posted" as const, erp: "SAP 5100004412" },
  { id: "JB-2026-08", period: "Aug 2026", lines: 1262, total: 577104.66, status: "posted" as const, erp: "SAP 5100004201" },
  { id: "JB-2026-07R", period: "Jul 2026", lines: 4, total: 1240, status: "reversal" as const, erp: "SAP 5100003990" },
];
export const batchAccounts = [["1610-900", "Accumulated depreciation", 0, 101233.84], ["6420-100", "Depreciation", 101233.84, 0], ["7110-300", "Interest", 69412.3, 0], ["2410-200", "Lease liability", 412600, 69412.3], ["2010-500", "Cash clearing", 0, 412600]] as [string, string, number, number][];

export const leaseEvents = [
  { v: "v2", title: "Rate override approved", at: "2026-11-17T09:41:00Z", by: "Jean Habimana" },
  { v: "v1", title: "Draft created", at: "2026-11-15T11:20:00Z", by: "Eric Uwase" },
];
export const leaseDocs = [["Lease_KHP-2026-114_signed.pdf", "2.1 MB", "Eric Uwase", 6], ["Treasury memo TM-2026-31.pdf", "1.4 MB", "Aline Mugisha", 2], ["Floor plan.pdf", "880 KB", "Eric Uwase", 1]] as const;
export const leaseAudit = [
  { at: "2026-11-17T09:41:00Z", actor: "Jean Habimana", initials: "JH", action: "Approved lease (v2)", object: "“Override rate verified against TM-2026-31.”", service: "Leases" },
  { at: "2026-11-16T14:02:00Z", actor: "Eric Uwase", initials: "EU", action: "Submitted for approval", object: "LSE-0087", service: "Leases" },
  { at: "2026-11-16T13:58:00Z", actor: "Eric Uwase", initials: "EU", action: "Dismissed duplicate warning", object: "LSE-0012", service: "Leases" },
  { at: "2026-11-15T11:20:00Z", actor: "Eric Uwase", initials: "EU", action: "Created draft", object: "LSE-0087", service: "Leases" },
];

export const maturity = [["< 1 yr", 1920400], ["1-2 yrs", 1702000], ["2-5 yrs", 3804600], ["> 5 yrs", 2410000]] as [string, number][];
export const disclosure = {
  rouByClass: [["Buildings", 3240118.3, 541020.45], ["Vehicles", 2104200, 368120.1], ["Equipment", 1918091.88, 307440.72]] as [string, number, number][],
  cashOutflow: 1624120,
  paragraphs: ["53(a)", "53(b)", "53(c)", "53(e)", "53(g)", "54", "55", "56", "57", "58"],
};
