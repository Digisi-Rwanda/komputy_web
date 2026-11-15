// Demo world for local dev, previews and e2e tests, built from src/data/mock (plan D10).
// Idempotent: removes the demo tenants/users (cascade) and recreates them. Run: npm run db:seed
import { inArray } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { ulid } from "@/server/ids";
import { hashPassword } from "@/server/password";
import { pricing } from "@/data/content";
import * as mock from "@/data/mock/data";
import * as admin from "@/data/mock/admin";
import * as platform from "@/data/mock/platform";

export const DEMO_PASSWORD = "Komputy-Demo-2026";
const days = (n: number) => new Date(Date.now() + n * 864e5);
// Display names in the mocks → ServiceId used everywhere else (types/domain.ts).
const SERVICE_ID: Record<string, string> = { ECL: "ecl", Leases: "leases", "Tax Provision": "tax", "Document Intelligence": "doc-intel", "Lease Planning": "lease-planning", "ERP Connect": "erp" };

const people: { key: string; name: string; email: string; title?: string; staff?: string; mfa?: boolean }[] = [
  ...mock.members.map((m) => ({ key: m.id, name: m.name, email: m.email, title: m.title, mfa: m.mfa })),
  ...platform.staff.map(([name, email, role]) => ({ key: email, name, email, staff: role })),
  ...platform.workspaces.filter((w) => w.id !== "ws-kivu").map((w) => ({ key: w.email, name: w.owner, email: w.email })),
];
const emails = people.map((p) => p.email);
const tenantIds = platform.workspaces.map((w) => w.id);

await db.transaction(async (tx) => {
  await tx.delete(schema.accessRequests).where(inArray(schema.accessRequests.tenantId, tenantIds));
  await tx.delete(schema.accessRequests).where(inArray(schema.accessRequests.code, platform.leads.map((l) => l.id)));
  // Tables without ON DELETE CASCADE to tenants: clear explicitly so a re-seed is clean.
  for (const t of [schema.invitations, schema.auditLogs, schema.userNotifications] as const) await tx.delete(t).where(inArray(t.tenantId, tenantIds));
  await tx.delete(schema.tenants).where(inArray(schema.tenants.id, tenantIds));
  await tx.delete(schema.users).where(inArray(schema.users.email, emails));
  await tx.delete(schema.catalog).where(inArray(schema.catalog.id, ["main"]));

  // Users + credential accounts (argon2id, same params as the previous engine)
  const hash = await hashPassword(DEMO_PASSWORD);
  const uid = new Map<string, string>();
  for (const p of people) {
    const id = ulid(); uid.set(p.key, id); uid.set(p.email, id);
    await tx.insert(schema.users).values({ id, name: p.name, email: p.email, title: p.title ?? null, isEmailVerified: true, platformRole: p.staff ?? null, isPlatformAdmin: p.staff === "admin", totpEnabled: false });
    await tx.insert(schema.authAccounts).values({ id: ulid(), userId: id, accountId: id, providerId: "credential", password: hash });
  }
  const kamau = uid.get("j.kamau@komputy.com")!, achieng = uid.get("m.achieng@komputy.com")!;

  // Workspaces with entitlements
  for (const w of platform.workspaces) {
    const state = (s: string) => w.services.find(([n]) => n === s)?.[1];
    const status = w.services.some(([, st]) => st === "suspended") ? "suspended" : w.paying ? "active" : "trial";
    await tx.insert(schema.tenants).values({
      id: w.id, name: w.name, slug: w.id.replace("ws-", ""), legalName: w.id === "ws-kivu" ? "Kivu Commercial Bank PLC" : `${w.name} Ltd`, country: w.country,
      plan: w.paying ? "growth" : "trial", status, currency: "USD", reportingCadence: "monthly", timezone: "Africa/Kigali",
      allowedDomains: [w.email.split("@")[1]], requireMfa: false, accountManagerId: w.am ? uid.get(platform.staff.find(([n]) => n === w.am)![1]) ?? null : null,
      mrrCents: w.paying ? 90_000 : 0, createdAt: new Date("2026-03-14T09:00:00Z"),
    });
    for (const svc of ["ecl", "leases"] as const) {
      const st = state(svc === "ecl" ? "ECL" : "Leases");
      if (!st) continue;
      const usage = w.usage.find(([u]) => u === (svc === "ecl" ? "runs" : "leases"));
      await tx.insert(schema.entitlements).values({
        id: ulid(), tenantId: w.id, service: svc, state: st,
        trialEndsAt: st === "trial" && w.trialEnds ? new Date(`${w.trialEnds}T23:59:59Z`) : null,
        startsAt: st === "active" ? new Date("2026-01-01T00:00:00Z") : null, endsAt: st === "active" ? new Date("2026-12-31T23:59:59Z") : null,
        limits: svc === "ecl" ? { runs_month: usage?.[2] ?? 20, loans_run: 250_000 } : { active_leases: usage?.[2] ?? 10, entities: 1 },
        watermark: st === "trial", contractRef: st === "active" ? `${w.id.slice(3, 6).toUpperCase()}-2026-${svc.toUpperCase()}` : null,
      });
    }
  }

  // Memberships (Kivu from the members mock; other workspaces: their owner)
  const roleRow = async (tenantId: string, userId: string, workspaceRole: string, legacy: string, ecl: string, leases: string, status = "active") => {
    const id = ulid();
    await tx.insert(schema.tenantMemberships).values({ id, tenantId, userId, workspaceRole, role: legacy, status });
    for (const [service, role] of [["ecl", ecl], ["leases", leases]] as const) if (role !== "none") await tx.insert(schema.memberServiceRoles).values({ id: ulid(), membershipId: id, service, role });
  };
  for (const m of mock.members.filter((x) => x.status !== "invited")) {
    await roleRow("ws-kivu", uid.get(m.id)!, m.workspaceRole, m.workspaceRole === "member" ? (m.ecl === "reviewer" ? "reviewer" : "analyst") : "administrator", m.ecl, m.leases, m.status === "disabled" ? "disabled" : "active");
  }
  for (const w of platform.workspaces.filter((x) => x.id !== "ws-kivu")) await roleRow(w.id, uid.get(w.email)!, "owner", "administrator", "reviewer", "reviewer");
  // Peter is also a viewer at Kivu (PA7)
  await roleRow("ws-kivu", uid.get("p.otieno@northgate.co.ke")!, "member", "analyst", "viewer", "none");

  // Pending invite (CA2: Patrick)
  const patrick = mock.members.find((m) => m.status === "invited")!;
  await tx.insert(schema.invitations).values({ id: ulid(), tenantId: "ws-kivu", email: patrick.email, invitedByUserId: uid.get(mock.me.id)!, role: "analyst", workspaceRole: "member", status: "pending", serviceRoles: { ecl: "analyst", leases: "none" }, expiresAt: days(1), createdAt: days(-6) });

  // Member requests (CA5) and the sales pipeline (PA5)
  const reqKind = { grant: "access", role: "role", service: "service" } as const;
  for (const [i, r] of admin.requests.entries()) {
    const requester = mock.members.find((m) => m.name === r.who)!;
    await tx.insert(schema.accessRequests).values({ id: ulid(), code: `REQ-30${40 + i}`, tenantId: "ws-kivu", requesterId: uid.get(requester.id)!, kind: reqKind[r.kind], scope: "member", status: "open",
      service: r.kind === "service" ? "tax" : r.requested.startsWith("Lease") ? "leases" : "ecl", details: { title: r.title, meta: r.meta, note: r.note, current: r.current, requested: r.requested }, createdAt: days(-[0.1, 1, 3][i]) });
  }
  const kindOf: Record<string, string> = { Quote: "quote", Trial: "trial", "More capacity": "capacity", Waitlist: "waitlist", Forwarded: "service", "Full access": "access", Activate: "access" };
  for (const l of platform.leads) {
    const id = ulid(), am = l.assignee ? uid.get(platform.staff.find(([n]) => n === l.assignee)![1]) : null;
    await tx.insert(schema.accessRequests).values({ id, code: l.id, tenantId: l.workspace ?? null, kind: kindOf[l.type], scope: "platform", status: l.stage, service: SERVICE_ID[l.services[0]],
      details: { company: l.company, type: l.type, size: l.size, contact: l.contact, message: l.message, services: l.services }, assigneeId: am ?? null, source: l.source, createdAt: days(-parseInt(l.age)) });
    await tx.insert(schema.requestEvents).values({ id: ulid(), requestId: id, kind: "created", note: `Submitted · ${l.source}`, createdAt: days(-parseInt(l.age)) });
    if (l.id === "REQ-0219") await tx.insert(schema.requestEvents).values([{ id: ulid(), requestId: id, actorId: achieng, kind: "moved", note: "Contacted by M. Achieng", createdAt: days(-3) }, { id: ulid(), requestId: id, actorId: achieng, kind: "note", note: "Wants 250 leases before December close", createdAt: days(-3) }]);
  }

  // Support access (CA7/PA9): one pending request, one ended session
  await tx.insert(schema.supportSessions).values([
    { id: ulid(), tenantId: "ws-kivu", staffId: kamau, reason: admin.supportRequest.reason, minutes: 120, status: "requested", createdAt: new Date(Date.now() - 10 * 6e4) },
    { id: ulid(), tenantId: "ws-kivu", staffId: kamau, reason: "Help with PD upload mapping", minutes: 120, status: "ended", decidedBy: uid.get(mock.me.id)!, startsAt: new Date("2026-10-12T10:02:00Z"), endsAt: new Date("2026-10-12T11:40:00Z"), endedBy: uid.get(mock.me.id)!, actionsLogged: 14 },
  ]);
  await tx.insert(schema.workspaceNotes).values({ id: ulid(), tenantId: "ws-kivu", authorId: achieng, body: "Negotiating Leases at USD 900/month, decision expected 20 Nov.", createdAt: days(-1) });

  // Notifications + audit trail for Aline
  const aline = uid.get(mock.me.id)!;
  const hrefs: Record<string, string> = { n1: "/ecl/runs/RUN-0141/summary", n2: "/leases/register/LSE-0087/summary", n3: "/admin/services", n4: "/ecl/runs/RUN-0136/summary", n5: "/admin/members" };
  for (const n of mock.notifications) await tx.insert(schema.userNotifications).values({ id: ulid(), userId: aline, tenantId: "ws-kivu", kind: n.kind, title: n.title, body: n.meta, isRead: n.read, href: hrefs[n.id], action: n.action ?? null, createdAt: new Date(n.at) });
  await tx.insert(schema.notificationPreferences).values({ id: ulid(), userId: aline, runCompleted: true, runFailed: true, weeklySummary: false, memberJoined: true, productUpdates: false, digest: "daily" });
  for (const e of [...mock.audit, ...admin.auditMore]) await tx.insert(schema.auditLogs).values({ id: ulid(), userId: uid.get(people.find((p) => p.name === e.actor || e.actor.startsWith(p.name))?.email ?? "") ?? null, tenantId: "ws-kivu", eventType: e.action, status: "success", details: { object: e.object, service: e.service }, createdAt: new Date(e.at) });
  for (const e of platform.audit) await tx.insert(schema.auditLogs).values({ id: ulid(), userId: e.actor === "System" ? null : uid.get(platform.staff.find(([n]) => n === e.actor)?.[1] ?? "") ?? null, tenantId: platform.workspaces.find((w) => w.name === e.ws)?.id ?? null, eventType: `platform.${e.action}`, status: "success", details: { detail: e.detail, reason: e.reason, staff: true }, createdAt: new Date(e.at) });

  // Catalog (PA6) seeded from the public pricing copy
  const packages = [{ name: "Trial", price: "Free", unit: "· 14 days", detail: "One service · trial limits · watermark", cta: "Start trial", featured: false, features: ["No card required", "Full product, trial limits"] }, ...pricing.plans.map((p) => ({ ...p, features: p.detail.split(" · ") }))];
  const doc = { services: platform.serviceCatalog.map(([name, status]) => ({ name, status })), packages, trialDefaults: platform.trialDefaults };
  await tx.insert(schema.catalog).values({ id: "main", draft: doc, published: doc, publishedAt: new Date() });
});

console.log(`Seeded ${people.length} people, ${tenantIds.length} workspaces. Password for every demo account: ${DEMO_PASSWORD}`);
console.log("Sign in as a.mugisha@kivubank.rw (workspace owner) or j.kamau@komputy.com (platform admin).");
process.exit(0);
