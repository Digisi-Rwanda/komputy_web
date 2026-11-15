// Platform (staff console) mock data, PA1-PA9. Staff see counts and metadata only.
import type { Lead, LeadStage as Stage, PWorkspace } from "@/types/domain";
export type { Lead, PWorkspace, Stage };

export const TODAY_LABEL = "11 Nov 2026";
export const stats = [["Workspaces", "128", "+6 this month", ""], ["Active trials", "17", "", ""], ["Trials ending ≤ 7 days", "5", "", "bg-warning"], ["Open requests", "6", "", "bg-info"], ["Paying workspaces", "74", "", ""], ["MRR (manual)", "USD 61,400", "", ""]] as const;
export const adoption = [["Expected Credit Loss", 96, "Active 68 · Trial 11"], ["Lease Accounting", 41, "Active 22 · Trial 6"]] as const;
export const waitlist = [["Tax Provision", 23], ["Lease Planning", 15], ["Document Intelligence", 31], ["ERP Connect", 12]] as const;
export const byState = [
  { m: "Jun", trial: 9, active: 58, suspended: 2, expired: 3 }, { m: "Jul", trial: 11, active: 61, suspended: 2, expired: 4 }, { m: "Aug", trial: 12, active: 64, suspended: 3, expired: 4 },
  { m: "Sep", trial: 14, active: 67, suspended: 2, expired: 5 }, { m: "Oct", trial: 15, active: 71, suspended: 3, expired: 5 }, { m: "Nov", trial: 17, active: 74, suspended: 3, expired: 6 },
];
export const health = [["API", "Normal", "positive"], ["Database", "Normal", "positive"], ["Redis", "Normal", "positive"], ["Storage", "62 % used", "positive"], ["Workers", "2 / 2", "positive"], ["Queue depth", "3", "positive"], ["Email outbox", "0 pending · 0 dead-letter", "positive"]] as const;
export const latency = Array.from({ length: 24 }, (_, h) => ({ h: `${String(h).padStart(2, "0")}:00`, p50: 82 + Math.round(18 * Math.sin(h / 3.5)) + (h === 14 ? 40 : 0), p95: 210 + Math.round(40 * Math.sin(h / 3.5)) + (h === 14 ? 260 : 0) }));
export const incidents = [["11 Nov 14:05", "Elevated API latency (p95 470 ms) · 18 min", "Resolved"], ["29 Oct 02:10", "Email provider delays · 42 min", "Resolved"], ["12 Oct 09:30", "Scheduled database maintenance · 15 min", "Completed"]] as const;

export const workspaces: PWorkspace[] = [
  { id: "ws-kivu", name: "Kivu Commercial Bank", country: "Rwanda", owner: "Aline Mugisha", email: "a.mugisha@kivubank.rw", services: [["ECL", "active"], ["Leases", "trial"]], trialEnds: "2026-11-16", usage: [["runs", 7, 20], ["leases", 8, 10]], last: "2 h ago", am: "M. Achieng", inactiveDays: 0, paying: true },
  { id: "ws-northgate", name: "Northgate Leasing", country: "Kenya", owner: "Peter Otieno", email: "p.otieno@northgate.co.ke", services: [["Leases", "trial"]], trialEnds: "2026-11-13", usage: [["leases", 9, 10]], last: "Today", am: "M. Achieng", inactiveDays: 0, paying: false },
  { id: "ws-lakeshore", name: "Lakeshore Microfinance", country: "Uganda", owner: "Ruth Nabirye", email: "r.nabirye@lakeshore.ug", services: [["ECL", "active"]], usage: [["runs", 3, 10]], last: "Yesterday", am: "J. Kamau", inactiveDays: 1, paying: true },
  { id: "ws-highland", name: "Highland SACCO", country: "Rwanda", owner: "Claude Mugabo", email: "c.mugabo@highland.rw", services: [["ECL", "suspended"]], usage: [], last: "41 days ago", am: "M. Achieng", inactiveDays: 41, paying: false },
  { id: "ws-coastal", name: "Coastal Credit Ltd", country: "Tanzania", owner: "Amina Said", email: "a.said@coastalcredit.tz", services: [["ECL", "requested"]], usage: [], last: "3 days ago", inactiveDays: 3, paying: false },
  { id: "ws-volta", name: "Volta Agri Finance", country: "Ghana", owner: "Kwame Mensah", email: "k.mensah@volta.gh", services: [["ECL", "trial"]], trialEnds: "2026-11-15", usage: [["runs", 2, 3]], last: "5 h ago", am: "J. Kamau", inactiveDays: 0, paying: false },
  { id: "ws-umoja", name: "Umoja Savings Bank", country: "Kenya", owner: "Grace Wanjiru", email: "g.wanjiru@umoja.co.ke", services: [["ECL", "active"], ["Leases", "active"]], usage: [["runs", 14, 30], ["leases", 162, 250]], last: "1 h ago", am: "M. Achieng", inactiveDays: 0, paying: true },
  { id: "ws-imara", name: "Imara Holdings", country: "Uganda", owner: "Moses Okello", email: "m.okello@imara.ug", services: [["Leases", "expired"]], usage: [], last: "64 days ago", am: "J. Kamau", inactiveDays: 64, paying: false },
];
export const AMS = ["M. Achieng", "J. Kamau", "T. Bizimana"];

export const leads: Lead[] = [
  { id: "REQ-0231", stage: "new", type: "Quote", company: "Coastal Credit Ltd", services: ["ECL"], size: "40k loans/run", source: "From pricing calculator", age: "3 d", contact: "Amina Said · a.said@coastalcredit.tz", message: "We report quarterly to the Bank of Tanzania and need IFRS 9 staging." },
  { id: "REQ-0233", stage: "new", type: "Forwarded", company: "Grace Ineza (Kivu)", services: ["Tax Provision"], size: "Member-forwarded", source: "Kivu admin", age: "1 d", workspace: "ws-kivu" },
  { id: "REQ-0234", stage: "new", type: "Waitlist", company: "Waitlist: 4 sign-ups", services: ["Document Intelligence"], size: "4 workspaces", source: "Locked screens", age: "2 d" },
  { id: "REQ-0219", stage: "contacted", type: "Full access", company: "Kivu Commercial Bank", services: ["Leases"], size: "250 leases", source: "Trial banner", age: "4 d", assignee: "M. Achieng", workspace: "ws-kivu", contact: "Aline Mugisha · a.mugisha@kivubank.rw · +250 788 000 114", message: "We'd like to move Lease Accounting to full access before our December close." },
  { id: "REQ-0214", stage: "negotiating", type: "Activate", company: "Northgate Leasing", services: ["Leases"], size: "3 entities", source: "Sales call", age: "9 d", assignee: "M. Achieng", workspace: "ws-northgate" },
  { id: "REQ-0205", stage: "won", type: "More capacity", company: "Lakeshore Microfinance", services: ["ECL"], size: "10 → 20 runs", source: "Request more drawer", age: "6 d", assignee: "J. Kamau", workspace: "ws-lakeshore" },
  { id: "REQ-0198", stage: "lost", type: "Trial", company: "Imara Holdings", services: ["Leases"], size: "40 leases", source: "Trial", age: "21 d", assignee: "J. Kamau" },
];
export const STAGES: [Stage, string][] = [["new", "New"], ["contacted", "Contacted"], ["negotiating", "Negotiating"], ["won", "Won (30 days)"], ["lost", "Lost"]];

export const serviceCatalog = [["Expected Credit Loss", "live"], ["Lease Accounting", "live"], ["Lease Planning & Analytics", "soon"], ["Tax Provision", "soon"], ["Document Intelligence", "soon"], ["ERP Connect", "soon"]] as [string, string][];
export const trialDefaults = [["Expected Credit Loss", "3 runs · 5,000 loans/run · 14 days"], ["Lease Accounting", "10 leases · 1 entity · 14 days"]] as const;

export const people = [
  { name: "Aline Mugisha", email: "a.mugisha@kivubank.rw", ws: ["Kivu Commercial Bank · Owner"], mfa: true, last: "Now", status: "active" },
  { name: "Peter Otieno", email: "p.otieno@northgate.co.ke", ws: ["Northgate Leasing · Owner", "Kivu Commercial Bank · Viewer"], mfa: true, last: "Today", status: "active" },
  { name: "Ruth Nabirye", email: "r.nabirye@lakeshore.ug", ws: ["Lakeshore · Owner"], mfa: true, last: "Yesterday", status: "active" },
  { name: "Eric Uwase", email: "e.uwase@kivubank.rw", ws: ["Kivu Commercial Bank · Member"], mfa: false, last: "Yesterday", status: "active" },
  { name: "Claude Mugabo", email: "c.mugabo@highland.rw", ws: ["Highland SACCO · Owner"], mfa: false, last: "41 days ago", status: "active" },
  { name: "Divine Mukamana", email: "d.mukamana@kivubank.rw", ws: ["Kivu Commercial Bank · Member"], mfa: true, last: "12 Oct", status: "disabled" },
];
export const staff = [["J. Kamau", "j.kamau@komputy.com", "admin"], ["M. Achieng", "m.achieng@komputy.com", "sales"], ["T. Bizimana", "t.bizimana@komputy.com", "support"]] as [string, string, string][];
export const STAFF_ROLES = [["admin", "Platform admin"], ["sales", "Sales (can propose, not activate)"], ["support", "Support (read-only)"]];

export const engines = [
  { svc: "ECL", v: "v1.3.0", status: "Default", released: "2 Oct 2026", ws: 112, notes: ["Lifetime PD term structure for Stage 2", "Faster collateral haircut lookups (-38 %)", "Fix: rounding in segment totals"] },
  { svc: "ECL", v: "v1.2.4", status: "Pinned", released: "14 Jun 2026", ws: 9, notes: ["Security patch"] },
  { svc: "ECL", v: "v1.3.1-rc", status: "Candidate", released: "6 Nov 2026", ws: 0, notes: ["Macro overlay scenarios up to 5", "Fix: Stage 3 cure period edge case"] },
  { svc: "Leases", v: "leases-1.0.0", status: "Default", released: "1 Sep 2026", ws: 41, notes: ["First release: IFRS 16 lessee model"] },
];
export const audit = [
  { at: "2026-11-10T16:20:00Z", actor: "M. Achieng", action: "Proposed activation", ws: "Kivu Commercial Bank", detail: "Leases", reason: "REQ-0219" },
  { at: "2026-11-10T11:47:10Z", actor: "J. Kamau", action: "Support session started", ws: "Kivu Commercial Bank", detail: "2 hours", reason: "Investigate failed run RUN-0136" },
  { at: "2026-11-09T09:12:00Z", actor: "J. Kamau", action: "Extended trial +7 d", ws: "Northgate Leasing", detail: "Leases", reason: "evaluating with auditors" },
  { at: "2026-11-08T15:02:00Z", actor: "J. Kamau", action: "Added units", ws: "Lakeshore Microfinance", detail: "ECL 10 → 20 runs", reason: "REQ-0205 won" },
  { at: "2026-11-01T08:00:00Z", actor: "System", action: "Suspended service", ws: "Highland SACCO", detail: "ECL", reason: "Contract expired" },
  { at: "2026-10-31T10:30:00Z", actor: "T. Bizimana", action: "Reset MFA", ws: "Umoja Savings Bank", detail: "g.wanjiru@umoja.co.ke", reason: "Verified by video call, ticket SUP-882" },
];
export const usageSeries = [{ m: "Jun", runs: 9, leases: 0 }, { m: "Jul", runs: 11, leases: 0 }, { m: "Aug", runs: 12, leases: 0 }, { m: "Sep", runs: 10, leases: 0 }, { m: "Oct", runs: 14, leases: 3 }, { m: "Nov", runs: 7, leases: 8 }];
