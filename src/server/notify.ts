import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema, type Tx } from "@/server/db/client";
import { enqueueEmail } from "@/server/email/enqueue";
import type { MessageProps } from "@/server/email/message";
import { ulid } from "@/server/ids";
import { channels, type NotifyEvent, type NotifyKind as Kind } from "@/lib/notify-events";

export interface Notice { event: NotifyEvent; kind: Kind; tenantId: string; title: string; body: string; href?: string; action?: string; email?: { subject: string; message: MessageProps } }

/** One entry point for in-app + email notices; honours each recipient's matrix, muted kinds and digest (NA2). */
export async function notify(userIds: string[], n: Notice, tx?: Tx) {
  if (!userIds.length) return;
  const q = tx ?? db;
  const [prefs, users] = await Promise.all([
    q.select().from(schema.notificationPreferences).where(inArray(schema.notificationPreferences.userId, userIds)),
    n.email ? q.select({ id: schema.users.id, email: schema.users.email }).from(schema.users).where(inArray(schema.users.id, userIds)) : Promise.resolve([]),
  ]);
  const byUser = new Map(prefs.map((p) => [p.userId, p]));
  const rows = [];
  for (const id of new Set(userIds)) {
    const c = channels(n.event, n.kind, byUser.get(id));
    if (c.app) rows.push({ id: ulid(), userId: id, tenantId: n.tenantId, kind: n.kind, isRead: false, title: n.title.slice(0, 255), body: n.body, href: n.href ?? null, action: n.action ?? null });
    const to = users.find((u) => u.id === id)?.email;
    if (c.email && n.email && to) await enqueueEmail(to, n.email.subject, n.email.message, tx);
  }
  if (rows.length) await q.insert(schema.userNotifications).values(rows);
}

/** Active owners/admins of a workspace (most workspace notices go to them). */
export async function workspaceAdmins(tenantId: string, tx?: Tx) {
  const r = await (tx ?? db).select({ id: schema.tenantMemberships.userId }).from(schema.tenantMemberships)
    .where(and(eq(schema.tenantMemberships.tenantId, tenantId), inArray(schema.tenantMemberships.workspaceRole, ["owner", "admin"]), eq(schema.tenantMemberships.status, "active")));
  return r.map((x) => x.id);
}
