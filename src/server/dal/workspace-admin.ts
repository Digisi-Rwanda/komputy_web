import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { listAudit } from "@/server/dal/audit";
import { ago, listMembers } from "@/server/dal/members";
import type { Tone } from "@/types/ui";
import { days as dayCount } from "@/lib/format";

export interface ServiceCard { id: "ecl" | "leases"; name: string; state: string; tone: Tone; dates: string; meters: [string, number, number][] }
const NAME = { ecl: "Expected Credit Loss (IFRS 9)", leases: "Lease Accounting (IFRS 16)" } as const;
const TONE: Record<string, Tone> = { active: "positive", trial: "warning", suspended: "negative", expired: "neutral", "trial-expired": "neutral", requested: "info" };
const d = (x: Date | null) => (x ? x.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "Not set");

/** CA4/CA1: entitlements as cards. shortcut: usage "used" is 0 until read from the engine (Phase 5). */
export async function serviceCards(tenantId: string): Promise<ServiceCard[]> {
  const rows = await db.select().from(schema.entitlements).where(and(eq(schema.entitlements.tenantId, tenantId), inArray(schema.entitlements.service, ["ecl", "leases"])));
  return rows.map((e) => {
    const lim = e.limits as Record<string, number>, svc = e.service as "ecl" | "leases";
    const days = e.trialEndsAt ? Math.ceil((e.trialEndsAt.getTime() - Date.now()) / 864e5) : null;
    return {
      id: svc, name: NAME[svc], state: e.state === "trial" ? "Trial" : e.state[0].toUpperCase() + e.state.slice(1), tone: TONE[e.state] ?? "neutral",
      dates: e.state === "trial" ? `Trial ends ${d(e.trialEndsAt)}${days !== null ? ` (${dayCount(Math.max(0, days))} left)` : ""}` : `Contract ${d(e.startsAt)} to ${d(e.endsAt)}${e.contractRef ? ` · Ref ${e.contractRef}` : ""}`,
      meters: svc === "ecl" ? [["Runs this month", 0, lim.runs_month ?? 0], ["Loans per run limit", lim.loans_run ?? 0, 0]] : [["Active leases", 0, lim.active_leases ?? 0], ["Entities", 0, lim.entities ?? 0]],
    };
  });
}

/** CA4 request history: what this workspace asked Komputy for, with pipeline status. */
export async function requestHistory(tenantId: string): Promise<[string, Tone, string, string][]> {
  const rows = await db.select().from(schema.accessRequests).where(and(eq(schema.accessRequests.tenantId, tenantId), eq(schema.accessRequests.scope, "platform"))).orderBy(desc(schema.accessRequests.createdAt)).limit(20);
  const STATUS: Record<string, [Tone, string]> = { new: ["info", "Sent"], contacted: ["info", "Contacted"], negotiating: ["warning", "Negotiating"], won: ["positive", "Won ✓"], lost: ["neutral", "Closed"] };
  return rows.map((r) => { const det = r.details as Record<string, string>; return [det.title ?? `${det.type ?? r.kind}: ${r.service ?? ""}`, ...(STATUS[r.status] ?? ["neutral", r.status]), ago(r.createdAt)] as [string, Tone, string, string]; });
}

/** CA1 overview: state first, then what needs attention. */
export async function adminOverview(tenantId: string) {
  const [members, cards, open, audit] = await Promise.all([
    listMembers(tenantId), serviceCards(tenantId),
    db.select({ id: schema.accessRequests.id, title: schema.accessRequests.details, at: schema.accessRequests.createdAt }).from(schema.accessRequests).where(and(eq(schema.accessRequests.tenantId, tenantId), eq(schema.accessRequests.scope, "member"), eq(schema.accessRequests.status, "open"))),
    listAudit(tenantId, 5),
  ]);
  const active = members.filter((m) => m.status === "active"), invited = members.filter((m) => m.status === "invited");
  const noMfa = active.filter((m) => !m.mfa);
  const attention: { icon: "lock" | "user" | "mail"; title: string; meta: string; action: string; href?: string; membershipIds?: string[]; invitationId?: string }[] = [];
  if (noMfa.length) attention.push({ icon: "lock", title: `${noMfa.length} member${noMfa.length > 1 ? "s haven't" : " hasn't"} enabled MFA`, meta: noMfa.slice(0, 3).map((m) => m.name).join(" · "), action: "Remind", membershipIds: noMfa.map((m) => m.id) });
  for (const r of open.slice(0, 3)) attention.push({ icon: "user", title: String((r.title as Record<string, string>).title ?? "Access request"), meta: ago(r.at), action: "Review", href: "/admin/requests" });
  for (const i of invited.filter((x) => x.lastActive === "Expires tomorrow").slice(0, 2)) attention.push({ icon: "mail", title: `Invite to ${i.email} expires tomorrow`, meta: "Pending invite", action: "Resend", invitationId: i.id.slice(4) });
  return {
    stats: { members: active.length, invites: invited.length, services: cards.filter((c) => ["Active", "Trial"].includes(c.state)), mfaPct: active.length ? Math.round(((active.length - noMfa.length) / active.length) * 100) : 100, noMfa: noMfa.length, requests: open.length },
    cards, attention, audit,
  };
}
