import { timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, inArray, isNull, lt, sql } from "drizzle-orm";
import { audit } from "@/server/audit";
import { db, schema } from "@/server/db/client";
import { bumpAuthz } from "@/server/dal/members";
import { enqueueEmail } from "@/server/email/enqueue";
import { env } from "@/server/env";
import { notify, workspaceAdmins } from "@/server/notify";

// Scheduled jobs (plan Phase 3/4). Call with `Authorization: Bearer $CRON_SECRET`:
//   POST /api/cron/events every minute · POST /api/cron/expire every 5 min · POST /api/cron/daily once a day (08:00 Africa/Kigali; also sends digests). Idempotent: safe to re-run.
const link = (path: string) => new URL(path, env.BETTER_AUTH_URL).toString();
const authorized = (req: Request) => {
  const got = Buffer.from(req.headers.get("authorization") ?? ""), want = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  return got.length === want.length && timingSafeEqual(got, want);
};

async function expire() {
  const now = new Date();
  return db.transaction(async (tx) => {
    const trials = await tx.update(schema.entitlements).set({ state: "trial-expired", updatedAt: now }).where(and(eq(schema.entitlements.state, "trial"), lt(schema.entitlements.trialEndsAt, now))).returning({ tenantId: schema.entitlements.tenantId, service: schema.entitlements.service });
    const invites = await tx.update(schema.invitations).set({ status: "expired", updatedAt: now }).where(and(eq(schema.invitations.status, "pending"), lt(schema.invitations.expiresAt, now))).returning({ id: schema.invitations.id });
    const sessions = await tx.update(schema.supportSessions).set({ status: "ended", updatedAt: now }).where(and(eq(schema.supportSessions.status, "active"), lt(schema.supportSessions.endsAt, now))).returning({ tenantId: schema.supportSessions.tenantId });
    const stale = await tx.update(schema.supportSessions).set({ status: "cancelled", updatedAt: now }).where(and(eq(schema.supportSessions.status, "requested"), lt(schema.supportSessions.createdAt, new Date(now.getTime() - 864e5)))).returning({ id: schema.supportSessions.id });
    for (const tenantId of new Set([...trials, ...sessions].map((r) => r.tenantId))) await bumpAuthz(tx, tenantId);
    for (const t of trials) {
      const name = t.service === "ecl" ? "Expected Credit Loss" : "Lease Accounting";
      await notify(await workspaceAdmins(t.tenantId, tx), { event: "trial", kind: "access", tenantId: t.tenantId, title: `Your ${name} trial ended`, body: "Your data stays available read-only.", href: "/admin/services", action: "Request access",
        email: { subject: `Your ${name} trial ended`, message: { preview: "Trial ended", headline: `Your ${name} trial ended`, paragraphs: ["Your data stays available read-only. Request full access to keep working."], cta: { label: "Request full access", href: link("/admin/services") } } } }, tx);
      await audit({ event: "trial.expired", userId: null, tenantId: t.tenantId, details: { service: t.service } }, tx);
    }
    for (const t of sessions) await notify(await workspaceAdmins(t.tenantId, tx), { event: "support", kind: "security", tenantId: t.tenantId, title: "Komputy Support session ended", body: "Access was removed automatically when the time ran out.", href: "/admin/security" }, tx);
    return { trialsExpired: trials.length, invitesExpired: invites.length, supportEnded: sessions.length, supportCancelled: stale.length };
  });
}

async function daily() {
  const now = new Date(), in3 = new Date(now.getTime() + 3 * 864e5);
  // Trial ends within 3 days → one reminder per entitlement (dedupe via audit trail).
  const ending = await db.select({ e: schema.entitlements, tenant: schema.tenants.name }).from(schema.entitlements).innerJoin(schema.tenants, eq(schema.tenants.id, schema.entitlements.tenantId))
    .where(and(eq(schema.entitlements.state, "trial"), lt(schema.entitlements.trialEndsAt, in3), isNull(schema.tenants.deletedAt)));
  let reminded = 0;
  for (const { e, tenant } of ending) {
    const [sent] = await db.select({ id: schema.auditLogs.id }).from(schema.auditLogs).where(and(eq(schema.auditLogs.tenantId, e.tenantId), eq(schema.auditLogs.eventType, "trial.reminder_sent"), sql`${schema.auditLogs.details}->>'entitlementId' = ${e.id}`));
    if (sent) continue;
    const owners = await workspaceAdmins(e.tenantId);
    const name = e.service === "ecl" ? "Expected Credit Loss" : "Lease Accounting";
    const days = Math.max(0, Math.ceil((e.trialEndsAt!.getTime() - now.getTime()) / 864e5));
    await db.transaction(async (tx) => {
      const subject = `Your ${name} trial ends in ${days} day${days === 1 ? "" : "s"}`;
      await notify(owners, { event: "trial", kind: "access", tenantId: e.tenantId, title: subject, body: "Your data stays available read-only after the trial.", href: "/admin/services", action: "Request access", email: { subject, message: {
        preview: `${days} days left in your trial`, headline: `${days} day${days === 1 ? "" : "s"} left in your trial`,
        paragraphs: [`The ${name} trial for ${tenant} ends on ${e.trialEndsAt!.toISOString().slice(0, 10)}.`, "Your data stays available read-only after the trial."],
        cta: { label: "Request full access", href: link("/admin/services") },
      } } }, tx);
      await audit({ event: "trial.reminder_sent", userId: null, tenantId: e.tenantId, details: { entitlementId: e.id, service: e.service } }, tx);
    });
    reminded++;
  }
  // Closing period over → soft-delete the workspace and ask the engine to purge its data and files.
  const closed = await db.update(schema.tenants).set({ status: "closed", deletedAt: now, updatedAt: now }).where(and(eq(schema.tenants.status, "closing"), lt(schema.tenants.closeRequestedAt, new Date(now.getTime() - 30 * 864e5)))).returning({ id: schema.tenants.id });
  for (const t of closed) {
    await audit({ event: "workspace.closed", userId: null, tenantId: t.id, details: {} });
    // Engine data + stored files go too (the engine queues an idempotent purge job).
    await fetch(new URL(`/api/v1/ops/tenants/${t.id}/purge`, env.ENGINE_URL), { method: "POST", headers: { Authorization: `Bearer ${env.ENGINE_SERVICE_TOKEN}` } })
      .catch((e: unknown) => console.error("[purge] engine unreachable", t.id, e));
  }
  return { reminded, closed: closed.length, digests: await digests(now) };
}

/** NA2 digest: one email with unread non-urgent notices since the last digest (daily, or weekly on Mondays). */
async function digests(now: Date) {
  const kinds = now.getUTCDay() === 1 ? ["daily", "weekly"] : ["daily"];
  const people = await db.select({ userId: schema.notificationPreferences.userId, digest: schema.notificationPreferences.digest, email: schema.users.email, name: schema.users.name })
    .from(schema.notificationPreferences).innerJoin(schema.users, eq(schema.users.id, schema.notificationPreferences.userId))
    .where(and(inArray(schema.notificationPreferences.digest, kinds), eq(schema.users.isActive, true), isNull(schema.users.deletedAt)));
  let sent = 0;
  for (const u of people) {
    const [last] = await db.select({ at: schema.auditLogs.createdAt }).from(schema.auditLogs).where(and(eq(schema.auditLogs.userId, u.userId), eq(schema.auditLogs.eventType, "digest.sent"))).orderBy(desc(schema.auditLogs.createdAt)).limit(1);
    const since = last?.at ?? new Date(now.getTime() - (u.digest === "weekly" ? 7 : 1) * 864e5);
    if (now.getTime() - since.getTime() < 20 * 3600e3) continue; // already sent today (re-runs are safe)
    const items = await db.select({ title: schema.userNotifications.title, body: schema.userNotifications.body, ws: schema.tenants.name }).from(schema.userNotifications)
      .innerJoin(schema.tenants, eq(schema.tenants.id, schema.userNotifications.tenantId))
      .where(and(eq(schema.userNotifications.userId, u.userId), eq(schema.userNotifications.isRead, false), gt(schema.userNotifications.createdAt, since))).orderBy(desc(schema.userNotifications.createdAt)).limit(30);
    if (!items.length) continue;
    await db.transaction(async (tx) => {
      await enqueueEmail(u.email, `Your Komputy ${u.digest} digest · ${items.length} update${items.length === 1 ? "" : "s"}`, {
        preview: `${items.length} updates since your last digest`, headline: `${items.length} update${items.length === 1 ? "" : "s"} for you`,
        paragraphs: [`Hi ${u.name.split(" ")[0]}, here's what happened since your last digest.`],
        details: items.map((i) => [i.ws, `${i.title}: ${i.body}`] as [string, string]),
        cta: { label: "Open notifications", href: link("/notifications") }, footer: "Change how often you get this in Account › Notifications.",
      }, tx);
      await audit({ event: "digest.sent", userId: u.userId, tenantId: null, details: { count: items.length } }, tx);
    });
    sent++;
  }
  return sent;
}

/** Every minute: engine notices → people, queued emails → Resend. */
async function events() {
  const { consumeEngineEvents, dispatchEmails } = await import("@/server/engine/events");
  return { notices: await consumeEngineEvents(), emails: await dispatchEmails() };
}

const JOBS: Record<string, () => Promise<unknown>> = { expire, daily, events };

export async function POST(req: Request, { params }: RouteContext<"/api/cron/[job]">) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  const job = JOBS[(await params).job];
  if (!job) return new Response("Unknown job", { status: 404 });
  return Response.json({ ok: true, result: await job() });
}
