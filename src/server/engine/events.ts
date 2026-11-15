import "server-only";
import { and, eq, inArray, notInArray, sql as dsql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { env } from "@/server/env";
import { notify } from "@/server/notify";
import type { NotifyEvent, NotifyKind } from "@/lib/notify-events";

type Notice = { to: string[] | "*" | "*reviewers"; event: NotifyEvent; kind: NotifyKind; title: string; body: string; href?: string | null; action?: string | null; exclude?: string[] };
const link = (p: string) => new URL(p, env.BETTER_AUTH_URL).toString();

/** Recipients for a notice: explicit ids, every active member, or the service's reviewers + workspace admins. */
async function recipients(tenantId: string, n: Notice): Promise<string[]> {
  if (Array.isArray(n.to)) return n.to;
  const m = schema.tenantMemberships, r = schema.memberServiceRoles;
  const service = n.kind === "leases" ? "leases" : "ecl";
  const rows = await db.select({ id: m.userId, wr: m.workspaceRole, role: r.role }).from(m)
    .leftJoin(r, and(eq(r.membershipId, m.id), eq(r.service, service)))
    .where(and(eq(m.tenantId, tenantId), eq(m.status, "active"), n.exclude?.length ? notInArray(m.userId, n.exclude) : undefined));
  return [...new Set(rows.filter((x) => n.to === "*" || x.wr === "owner" || x.wr === "admin" || x.role === "reviewer" || x.role === "poster").map((x) => x.id))];
}

/**
 * Engine → people. The engine appends `engine.outbox_events`; this turns them into in-app + email notices through
 * notify() (which applies each person's preferences). Runs every minute (cron `events`); SKIP LOCKED makes it safe
 * on several instances; each row is consumed exactly once in the same transaction as its notices.
 */
export async function consumeEngineEvents(limit = 200): Promise<number> {
  return db.transaction(async (tx) => {
    const rows = await tx.execute<{ id: string; tenant_id: string; type: string; payload: Notice }>(dsql`
      SELECT id, tenant_id, type, payload FROM engine.outbox_events WHERE consumed_at IS NULL ORDER BY created_at LIMIT ${limit} FOR UPDATE SKIP LOCKED`);
    for (const e of rows) {
      if (e.type === "notify") {
        const n = e.payload, ids = (await recipients(e.tenant_id, n)).filter((id) => !n.exclude?.includes(id));
        await notify(ids, {
          event: n.event, kind: n.kind, tenantId: e.tenant_id, title: n.title, body: n.body, href: n.href ?? undefined, action: n.action ?? undefined,
          email: { subject: n.title, message: { preview: n.title, headline: n.title, paragraphs: [n.body], ...(n.href && { cta: { label: n.action ?? "Open", href: link(n.href) } }) } },
        }, tx);
      }
    }
    // One text parameter split in SQL: a JS array in this template expands to a row ($1, $2), which Postgres can't cast to text[].
    if (rows.length) await tx.execute(dsql`UPDATE engine.outbox_events SET consumed_at = now() WHERE id = ANY(string_to_array(${rows.map((r) => r.id).join(",")}, ','))`);
    return rows.length;
  });
}

/** Delivers queued emails via Resend (HTTP). Without a key (dev) they stay queued; retries with a cap. */
export async function dispatchEmails(limit = 50): Promise<{ sent: number; failed: number; skipped: boolean }> {
  if (!env.RESEND_API_KEY) return { sent: 0, failed: 0, skipped: true };
  const rows = await db.select().from(schema.emailOutbox).where(and(inArray(schema.emailOutbox.status, ["pending", "retry"]), dsql`${schema.emailOutbox.dispatchAttempts} < 5`)).limit(limit);
  let sent = 0, failed = 0;
  for (const r of rows) {
    const p = r.payload as { to: string; subject: string; html: string; text: string };
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": r.id },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [p.to], subject: p.subject, html: p.html, text: p.text }),
    }).catch((e: unknown) => ({ ok: false, status: 0, text: async () => String(e) }));
    const ok = res.ok;
    await db.update(schema.emailOutbox).set(ok ? { status: "sent", dispatchedAt: new Date(), dispatchAttempts: r.dispatchAttempts + 1 }
      : { status: "retry", dispatchAttempts: r.dispatchAttempts + 1, lastDispatchError: (await res.text()).slice(0, 500) }).where(eq(schema.emailOutbox.id, r.id));
    if (ok) sent++; else failed++;
  }
  return { sent, failed, skipped: false };
}
