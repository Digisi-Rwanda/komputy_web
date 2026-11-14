"use server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/server/db/client";
import { listNotifications } from "@/server/dal/notifications";
import { ulid } from "@/server/ids";
import { mutate, UserError } from "@/server/mutate";
import { getPrincipal } from "@/server/session";

const KIND = z.enum(["runs", "leases", "access", "workspace", "security"]);

/** Read path for the bell/page (polled every 30 s by useNotifications). */
export async function fetchNotifications() {
  const p = await getPrincipal();
  if (!p?.tenantId) return { items: [], muted: [] };
  return listNotifications(p.userId, p.tenantId);
}

export const markNotificationsRead = mutate({
  action: "notifications.manage",
  schema: z.object({ ids: z.array(z.string().max(26)).max(200).optional() }), // omit ids = all
  run: async ({ p, input, tx }) => {
    const mine = and(eq(schema.userNotifications.userId, p.userId), eq(schema.userNotifications.tenantId, p.tenantId!), eq(schema.userNotifications.isRead, false));
    await tx.update(schema.userNotifications).set({ isRead: true, readAt: new Date() }).where(input.ids ? and(mine, inArray(schema.userNotifications.id, input.ids)) : mine);
  },
});

export const setKindMuted = mutate({
  action: "notifications.manage",
  schema: z.object({ kind: KIND, muted: z.boolean() }),
  run: async ({ p, input, tx }) => {
    const [row] = await tx.select().from(schema.notificationPreferences).where(eq(schema.notificationPreferences.userId, p.userId));
    const next = new Set(row?.mutedKinds ?? []);
    if (input.muted) next.add(input.kind); else next.delete(input.kind);
    if (row) await tx.update(schema.notificationPreferences).set({ mutedKinds: [...next], updatedAt: new Date() }).where(eq(schema.notificationPreferences.id, row.id));
    else await tx.insert(schema.notificationPreferences).values({ id: ulid(), userId: p.userId, runCompleted: true, runFailed: true, weeklySummary: false, memberJoined: true, productUpdates: false, mutedKinds: [...next] });
  },
});

/** NA2 matrix cell ("<event>:<app|email>") or digest. Locked cells (security, reviewer sign-off email) can't be turned off. */
const LOCKED = new Set(["device:app", "device:email", "pw:app", "pw:email", "support:app", "support:email", "signoff:email"]);
export const saveNotificationPrefs = mutate({
  action: "notifications.manage",
  schema: z.object({ cell: z.string().regex(/^[a-z]+:(app|email)$/).optional(), on: z.boolean().optional(), digest: z.enum(["off", "daily", "weekly"]).optional() }),
  run: async ({ p, input, tx }) => {
    if (input.cell && LOCKED.has(input.cell)) throw new UserError("This notification is always on.");
    const [row] = await tx.select().from(schema.notificationPreferences).where(eq(schema.notificationPreferences.userId, p.userId));
    const matrix = { ...((row?.matrix ?? {}) as Record<string, boolean>), ...(input.cell && input.on !== undefined ? { [input.cell]: input.on } : {}) };
    const values = { matrix, ...(input.digest && { digest: input.digest }), updatedAt: new Date() };
    if (row) await tx.update(schema.notificationPreferences).set(values).where(eq(schema.notificationPreferences.id, row.id));
    else await tx.insert(schema.notificationPreferences).values({ id: ulid(), userId: p.userId, runCompleted: true, runFailed: true, weeklySummary: false, memberJoined: true, productUpdates: false, ...values });
  },
});

export async function fetchNotificationPrefs() {
  const p = await getPrincipal();
  if (!p) return { matrix: {}, digest: "daily" };
  const [row] = await db.select({ matrix: schema.notificationPreferences.matrix, digest: schema.notificationPreferences.digest }).from(schema.notificationPreferences).where(eq(schema.notificationPreferences.userId, p.userId));
  return { matrix: (row?.matrix ?? {}) as Record<string, boolean>, digest: row?.digest ?? "daily" };
}
