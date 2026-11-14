// Company admin mock data (CA1–CA9). Ties to members/audit in data.ts.
import type { Tone } from "@/types/ui";

export const workspaceCode = "WS · KIVU-01";
export const attention = [
  { icon: "lock", title: "2 members haven't enabled MFA", meta: "Eric Uwase · Grace Ineza", action: "Remind" },
  { icon: "user", title: "Jean Habimana asked for Lease Accounting access", meta: "2 hours ago", action: "Review", href: "/admin/requests" },
  { icon: "mail", title: "Invite to p.nkurunziza@kivubank.rw expires tomorrow", meta: "Sent 6 days ago", action: "Resend" },
] as const;

import type { AccessRequest } from "@/types/domain";
export type { AccessRequest };
export const requests: AccessRequest[] = [
  { id: "rq1", who: "Jean Habimana", initials: "JH", title: "Jean Habimana asked for Lease Accounting access", meta: "Role requested: Reviewer · “I review month-end close for the property portfolio.”", age: "2 h ago", kind: "grant", current: "ECL Reviewer · Leases Reviewer", requested: "Lease Accounting · Reviewer" },
  { id: "rq2", who: "Eric Uwase", initials: "EU", title: "Eric Uwase asked for the Reviewer role in ECL", meta: "Currently Analyst", age: "Yesterday", kind: "role", note: "Eric submitted RUN-0143 — he won't be able to approve it (segregation of duties).", current: "ECL Analyst · Leases no access", requested: "ECL · Reviewer" },
  { id: "rq3", who: "Grace Ineza", initials: "GI", title: "Grace Ineza asked for Tax Provision", meta: "Service not active in this workspace", age: "3 days ago", kind: "service", current: "ECL Viewer · Leases Auditor", requested: "Tax Provision" },
];

export const services = [
  { id: "ecl", name: "Expected Credit Loss (IFRS 9)", state: ["positive", "Active"] as [Tone, string], dates: "Contract 1 Jan 2026 – 31 Dec 2026 · Ref KCB-2026-ECL", meters: [["Runs this month", 7, 20], ["Loans per run limit", 250000, 0]] as [string, number, number][] },
  { id: "leases", name: "Lease Accounting (IFRS 16)", state: ["warning", "Trial"] as [Tone, string], dates: "Started 2 Nov 2026 · ends 16 Nov 2026 (9 days left)", meters: [["Active leases", 8, 10], ["Entities", 1, 1]] as [string, number, number][] },
];
export const notEnabled = ["Lease Planning & Analytics", "Document Intelligence", "ERP Connect"];
export const requestHistory = [["Request full access — Lease Accounting", "info", "Contacted", "by M. Achieng · 8 Nov"], ["Increase runs to 30/month — ECL", "positive", "Won ✓", "3 Oct"]] as [string, Tone, string, string][];

export const supportRequest = { who: "J. Kamau (Ledgerline Support)", reason: "Investigate failed run RUN-0136 reconciliation check 4.", duration: "2 hours", age: "10 min ago" };
export const supportSessions = [["J. Kamau", "12 Oct 10:02–11:40", "Ended by Aline Mugisha", 14]] as [string, string, string, number][];

export const auditMore = [
  { at: "2026-11-10T11:47:10Z", actor: "J. Kamau (Ledgerline Support)", initials: "JK", action: "Support session started", object: "Approved by Aline Mugisha", service: "Platform", staff: true },
  { at: "2026-11-09T10:12:44Z", actor: "Jean Habimana", initials: "JH", action: "Returned lease", object: "LSE-0139", service: "Leases" },
  { at: "2026-11-08T14:40:18Z", actor: "Aline Mugisha", initials: "AM", action: "Invited member", object: "p.nkurunziza@kivubank.rw", service: "Workspace" },
  { at: "2026-11-07T09:03:51Z", actor: "Eric Uwase", initials: "EU", action: "Started run", object: "RUN-0143", service: "ECL" },
  { at: "2026-11-05T16:22:07Z", actor: "Aline Mugisha", initials: "AM", action: "Locked period", object: "Sep 2026", service: "Leases" },
];
