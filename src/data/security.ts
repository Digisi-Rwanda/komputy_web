// Security page content (blueprint §6.5, P7).
import type { IconName } from "@/components/atoms/Icon";

export const PRINCIPLES: { icon: IconName; title: string; body: string }[] = [
  { icon: "layers", title: "Workspace isolation", body: "Every query, file and cache entry is scoped to your workspace." },
  { icon: "lock", title: "Encryption", body: "TLS 1.2+ in transit, AES 256 at rest, including uploaded workbooks." },
  { icon: "security", title: "Identity", body: "MFA, session controls, checked against known breaches passwords and account lockout." },
  { icon: "users", title: "Staff access", body: "Our team can't see your results. Support access needs your admin's approval, is time limited and fully logged." },
  { icon: "audit", title: "Audit", body: "Every action recorded with who and when, exportable to CSV and retained for 7 years." },
  { icon: "key", title: "Reproducibility", body: "Inputs hashed and engine versions pinned on every run." },
];

export const SUPPORT_FLOW = [
  { title: "Support requests access", body: "Reason and duration (max 2 h)." },
  { title: "Your admin approves", body: "Or denies. You stay in control." },
  { title: "Banner on both sides", body: "Everyone sees the session is live." },
  { title: "Session ends, log kept", body: "Every action in your audit log." },
];

export const COMPLIANCE = [
  { item: "Penetration test", status: "Completed 2026", tone: "positive" as const },
  { item: "ISO 27001", status: "In progress", tone: "warning" as const },
  { item: "SOC 2 Type I", status: "Planned", tone: "info" as const },
];

export const DATA = [
  ["Region", "EU (Frankfurt) by default; regional hosting on request."],
  ["Backups", "Encrypted daily backups, 30 day retention."],
  ["Retention", "Data kept for the contract term; expired workspaces are view only for 90 days, then archived."],
  ["Export", "Everything exportable at any time: runs, leases, journals and the audit log."],
] as const;

export const SUBPROCESSORS = [
  { provider: "Cloud hosting provider", purpose: "Infrastructure and storage", region: "EU" },
  { provider: "Email delivery provider", purpose: "Transactional emails", region: "EU" },
  { provider: "Error monitoring", purpose: "Observability and alerts", region: "EU" },
];

export const SECURITY_EMAIL = "security@komputy.com";
