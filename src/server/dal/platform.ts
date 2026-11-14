import "server-only";
import { and, desc, eq, gte, inArray, isNull, like, or, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { ago } from "@/server/dal/members";
import type { Lead, LeadStage, PWorkspace, ServiceState } from "@/types/domain";

// Staff console reads (PA1–PA9). Counts and metadata only: never client figures (plan §1.1, PA1 note).

const SVC_LABEL: Record<string, string> = { ecl: "ECL", leases: "Leases" };
const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : undefined);

/** PA2: every workspace with services, trial end, limits, last activity and account manager. */
export async function listPlatformWorkspaces(ids?: string[]): Promise<PWorkspace[]> {
  const where = ids ? and(isNull(schema.tenants.deletedAt), inArray(schema.tenants.id, ids)) : isNull(schema.tenants.deletedAt);
  const [tenants, ents, owners, activity, ams] = await Promise.all([
    db.select().from(schema.tenants).where(where).orderBy(desc(schema.tenants.createdAt)).limit(500),
    db.select().from(schema.entitlements),
    db.select({ tenantId: schema.tenantMemberships.tenantId, name: schema.users.name, email: schema.users.email }).from(schema.tenantMemberships).innerJoin(schema.users, eq(schema.users.id, schema.tenantMemberships.userId)).where(eq(schema.tenantMemberships.workspaceRole, "owner")),
    db.select({ tenantId: schema.tenantMemberships.tenantId, last: sql<Date | null>`max(${schema.users.lastLoginAt})` }).from(schema.tenantMemberships).innerJoin(schema.users, eq(schema.users.id, schema.tenantMemberships.userId)).groupBy(schema.tenantMemberships.tenantId),
    db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(sql`${schema.users.platformRole} is not null`),
  ]);
  const amName = new Map(ams.map((a) => [a.id, a.name]));
  return tenants.map((t) => {
    const mine = ents.filter((e) => e.tenantId === t.id && SVC_LABEL[e.service]);
    const last = activity.find((a) => a.tenantId === t.id)?.last ?? null;
    const lastDate = last ? new Date(last) : t.createdAt;
    const trial = mine.find((e) => e.state === "trial");
    const owner = owners.find((o) => o.tenantId === t.id);
    return {
      id: t.id, name: t.name, country: t.country ?? "", owner: owner?.name ?? "—", email: owner?.email ?? "",
      services: mine.map((e) => [SVC_LABEL[e.service], (t.status === "closing" || t.status === "suspended" ? "suspended" : e.state) as ServiceState]),
      trialEnds: day(trial?.trialEndsAt ?? null),
      // shortcut: usage "used" comes from the engine (Phase 5); limits are real.
      usage: mine.map((e) => { const l = e.limits as Record<string, number>; return e.service === "ecl" ? ["runs", 0, l.runs_month ?? 0] : ["leases", 0, l.active_leases ?? 0]; }) as [string, number, number][],
      last: ago(last ? new Date(last) : null), am: t.accountManagerId ? amName.get(t.accountManagerId) : undefined,
      inactiveDays: Math.floor((Date.now() - lastDate.getTime()) / 864e5), paying: t.plan !== "trial" && t.status === "active",
    };
  });
}

/** PA1 overview: platform-wide counts. */
export async function platformOverview() {
  const [workspaces, ents, waitlist, openReq, newThisMonth] = await Promise.all([
    listPlatformWorkspaces(),
    db.select({ service: schema.entitlements.service, state: schema.entitlements.state, n: sql<number>`count(*)::int` }).from(schema.entitlements).groupBy(schema.entitlements.service, schema.entitlements.state),
    db.select({ service: schema.accessRequests.service, n: sql<number>`count(*)::int` }).from(schema.accessRequests).where(eq(schema.accessRequests.kind, "waitlist")).groupBy(schema.accessRequests.service),
    db.$count(schema.accessRequests, and(eq(schema.accessRequests.scope, "platform"), inArray(schema.accessRequests.status, ["new", "contacted", "negotiating"]))),
    db.$count(schema.tenants, and(isNull(schema.tenants.deletedAt), gte(schema.tenants.createdAt, new Date(new Date().getFullYear(), new Date().getMonth(), 1)))),
  ]);
  const [{ mrr }] = await db.select({ mrr: sql<number>`coalesce(sum(${schema.tenants.mrrCents}),0)::int` }).from(schema.tenants).where(and(isNull(schema.tenants.deletedAt), eq(schema.tenants.status, "active")));
  const soon = workspaces.filter((w) => w.trialEnds && (Date.parse(w.trialEnds) - Date.now()) / 864e5 <= 7).sort((a, b) => a.trialEnds!.localeCompare(b.trialEnds!));
  const count = (svc: string, state?: string) => ents.filter((e) => e.service === svc && (!state || e.state === state)).reduce((a, e) => a + e.n, 0);
  const NAMES: Record<string, string> = { tax: "Tax Provision", "lease-planning": "Lease Planning", "doc-intel": "Document Intelligence", erp: "ERP Connect" };
  return {
    stats: [
      ["Workspaces", String(workspaces.length), `+${newThisMonth} this month`, ""], ["Active trials", String(count("ecl", "trial") + count("leases", "trial")), "", ""],
      ["Trials ending ≤ 7 days", String(soon.length), "", soon.length ? "bg-warning" : ""], ["Open requests", String(openReq), "", openReq ? "bg-info" : ""],
      ["Paying workspaces", String(workspaces.filter((w) => w.paying).length), "", ""], ["MRR (manual)", `USD ${(mrr / 100).toLocaleString("en-US")}`, "", ""],
    ] as [string, string, string, string][],
    adoption: (["ecl", "leases"] as const).map((s) => [s === "ecl" ? "Expected Credit Loss" : "Lease Accounting", count(s), `Active ${count(s, "active")} · Trial ${count(s, "trial")}`] as [string, number, string]),
    waitlist: waitlist.filter((w) => w.service && NAMES[w.service]).map((w) => [NAMES[w.service!], w.n] as [string, number]),
    trials: soon,
  };
}

const KIND_LABEL: Record<string, Lead["type"]> = { quote: "Quote", trial: "Trial", capacity: "More capacity", waitlist: "Waitlist", service: "Forwarded", access: "Full access" };

/** PA5 pipeline: platform-scope requests + timeline. */
export async function listLeads(tenantId?: string): Promise<(Lead & { timeline: string[] })[]> {
  const rows = await db.select({ r: schema.accessRequests, assignee: schema.users.name }).from(schema.accessRequests).leftJoin(schema.users, eq(schema.users.id, schema.accessRequests.assigneeId))
    .where(tenantId ? and(eq(schema.accessRequests.scope, "platform"), eq(schema.accessRequests.tenantId, tenantId)) : eq(schema.accessRequests.scope, "platform"))
    .orderBy(desc(schema.accessRequests.createdAt)).limit(300);
  const events = rows.length ? await db.select({ e: schema.requestEvents, actor: schema.users.name }).from(schema.requestEvents).leftJoin(schema.users, eq(schema.users.id, schema.requestEvents.actorId)).where(inArray(schema.requestEvents.requestId, rows.map((r) => r.r.id))).orderBy(schema.requestEvents.createdAt) : [];
  return rows.map(({ r, assignee }) => {
    const d = r.details as Record<string, unknown>;
    return {
      id: r.id, code: r.code, stage: r.status as LeadStage, type: (d.type as Lead["type"]) ?? KIND_LABEL[r.kind] ?? "Quote", company: String(d.company ?? "Unknown"),
      services: (d.services as string[] | undefined) ?? [r.service ?? "—"], size: String(d.size ?? ""), source: r.source ?? "—", age: ago(r.createdAt).replace(" ago", ""),
      assignee: assignee ?? undefined, workspace: r.tenantId ?? undefined, contact: d.contact as string | undefined, message: d.message as string | undefined,
      timeline: events.filter((e) => e.e.requestId === r.id).map((e) => `${e.e.note ?? e.e.kind}${e.actor ? ` · ${e.actor}` : ""} · ${e.e.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`),
    };
  });
}

/** PA3 detail extras: notes, members (metadata), support sessions, platform audit for the workspace. */
export async function platformWorkspaceDetail(tenantId: string) {
  const [notes, members, sessions, audit, [tenant]] = await Promise.all([
    db.select({ n: schema.workspaceNotes, author: schema.users.name }).from(schema.workspaceNotes).leftJoin(schema.users, eq(schema.users.id, schema.workspaceNotes.authorId)).where(eq(schema.workspaceNotes.tenantId, tenantId)).orderBy(desc(schema.workspaceNotes.createdAt)).limit(50),
    db.select({ u: schema.users, role: schema.tenantMemberships.workspaceRole, status: schema.tenantMemberships.status }).from(schema.tenantMemberships).innerJoin(schema.users, eq(schema.users.id, schema.tenantMemberships.userId)).where(eq(schema.tenantMemberships.tenantId, tenantId)),
    db.select({ s: schema.supportSessions, staff: schema.users.name }).from(schema.supportSessions).innerJoin(schema.users, eq(schema.users.id, schema.supportSessions.staffId)).where(eq(schema.supportSessions.tenantId, tenantId)).orderBy(desc(schema.supportSessions.createdAt)).limit(20),
    db.select({ a: schema.auditLogs, actor: schema.users.name }).from(schema.auditLogs).leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.userId)).where(and(eq(schema.auditLogs.tenantId, tenantId), or(like(schema.auditLogs.eventType, "platform.%"), like(schema.auditLogs.eventType, "support.%")))).orderBy(desc(schema.auditLogs.createdAt)).limit(100),
    db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)),
  ]);
  return {
    tenant,
    notes: notes.map((n) => ({ body: n.n.body, by: `${n.author ?? "Staff"} · ${ago(n.n.createdAt)}` })),
    members: members.map((m) => ({ id: m.u.id, name: m.u.name, email: m.u.email, role: m.role, mfa: m.u.totpEnabled, last: ago(m.u.lastLoginAt), verified: m.u.isEmailVerified, active: m.status === "active" && m.u.isActive })),
    sessions: sessions.map((s) => ({ id: s.s.id, staff: s.staff, staffId: s.s.staffId, reason: s.s.reason, minutes: s.s.minutes, status: s.s.status, endsAt: s.s.endsAt?.toISOString() ?? null })),
    audit: audit.map((x) => { const d = (x.a.details ?? {}) as Record<string, string>; return { at: x.a.createdAt.toISOString(), actor: x.actor ?? "System", action: x.a.eventType.replace(/^platform\./, ""), detail: d.detail ?? d.service ?? "", reason: d.reason ?? "" }; }),
  };
}

/** PA7: everyone with a login, their workspaces and roles; and our staff. */
export async function listPeople() {
  const [users, memberships] = await Promise.all([
    db.select().from(schema.users).where(isNull(schema.users.deletedAt)).orderBy(desc(schema.users.lastLoginAt)).limit(500),
    db.select({ userId: schema.tenantMemberships.userId, role: schema.tenantMemberships.workspaceRole, tenant: schema.tenants.name }).from(schema.tenantMemberships).innerJoin(schema.tenants, eq(schema.tenants.id, schema.tenantMemberships.tenantId)),
  ]);
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  return {
    people: users.filter((u) => !u.platformRole).map((u) => ({ id: u.id, name: u.name, email: u.email, ws: memberships.filter((m) => m.userId === u.id).map((m) => `${m.tenant} · ${cap(m.role)}`), mfa: u.totpEnabled, last: ago(u.lastLoginAt), status: u.isActive ? "active" : "disabled" })),
    staff: users.filter((u) => u.platformRole).map((u) => [u.id, u.name, u.email, u.platformRole!] as [string, string, string, string]),
  };
}

/** PA8.3: staff actions across all workspaces. */
export async function platformAudit(limit = 300) {
  const rows = await db.select({ a: schema.auditLogs, actor: schema.users.name, tenant: schema.tenants.name }).from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.userId)).leftJoin(schema.tenants, eq(schema.tenants.id, schema.auditLogs.tenantId))
    .where(or(like(schema.auditLogs.eventType, "platform.%"), like(schema.auditLogs.eventType, "support.%"))).orderBy(desc(schema.auditLogs.createdAt)).limit(limit);
  return rows.map(({ a, actor, tenant }) => { const d = (a.details ?? {}) as Record<string, string>; return { at: a.createdAt.toISOString(), actor: actor ?? "System", action: a.eventType.replace(/^platform\./, ""), ws: tenant ?? "—", detail: d.detail ?? d.service ?? "", reason: d.reason ?? "" }; });
}

export async function getCatalog() {
  const [c] = await db.select().from(schema.catalog).where(eq(schema.catalog.id, "main"));
  return c ?? null;
}
