import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import type { Notification } from "@/types/domain";

const KINDS = new Set<Notification["kind"]>(["runs", "leases", "access", "workspace", "security"]);

/** NA1: the caller's notifications in the active workspace (newest 50) + muted kinds. */
export async function listNotifications(userId: string, tenantId: string) {
  const [rows, [prefs]] = await Promise.all([
    db.select().from(schema.userNotifications).where(and(eq(schema.userNotifications.userId, userId), eq(schema.userNotifications.tenantId, tenantId))).orderBy(desc(schema.userNotifications.createdAt)).limit(50),
    db.select({ muted: schema.notificationPreferences.mutedKinds }).from(schema.notificationPreferences).where(eq(schema.notificationPreferences.userId, userId)),
  ]);
  const items: Notification[] = rows.map((r) => ({
    id: r.id, kind: KINDS.has(r.kind as Notification["kind"]) ? (r.kind as Notification["kind"]) : "workspace", title: r.title, meta: r.body,
    at: r.createdAt.toISOString(), read: r.isRead, action: r.action ?? undefined, href: r.href ?? undefined,
  }));
  return { items, muted: (prefs?.muted ?? []) as Notification["kind"][] };
}
