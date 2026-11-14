"use server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@/server/db/client";
import { bumpAuthz } from "@/server/dal/members";
import { mutate, UserError } from "@/server/mutate";

const DOMAIN = z.string().toLowerCase().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/, "Enter a domain like example.com");

/** CA7 workspace policy. Partial update; every change is audited with before/after. */
export const updateSecurityPolicy = mutate({
  action: "security.manage",
  schema: z.object({
    requireMfa: z.boolean().optional(), timeoutHours: z.union([z.literal(1), z.literal(8), z.literal(24)]).optional(), idleSignout: z.boolean().optional(),
    domains: z.array(DOMAIN).min(1, "Keep at least one allowed domain").max(20).optional(), supportPolicy: z.enum(["ask", "auto", "never"]).optional(),
  }),
  run: async ({ p, input, tx, audit }) => {
    const [before] = await tx.select().from(schema.tenants).where(eq(schema.tenants.id, p.tenantId!));
    await tx.update(schema.tenants).set({
      ...(input.requireMfa !== undefined && { requireMfa: input.requireMfa }), ...(input.timeoutHours && { sessionTimeoutHours: input.timeoutHours }),
      ...(input.idleSignout !== undefined && { idleSignout: input.idleSignout }), ...(input.domains && { allowedDomains: [...new Set(input.domains)] }),
      ...(input.supportPolicy && { supportPolicy: input.supportPolicy }), updatedAt: new Date(),
    }).where(eq(schema.tenants.id, p.tenantId!));
    if (input.supportPolicy === "never") await tx.update(schema.supportSessions).set({ status: "ended", endedBy: p.userId, updatedAt: new Date() }).where(and(eq(schema.supportSessions.tenantId, p.tenantId!), eq(schema.supportSessions.status, "active")));
    await audit("security.policy_changed", { before: { requireMfa: before.requireMfa, timeoutHours: before.sessionTimeoutHours, idleSignout: before.idleSignout, domains: before.allowedDomains, supportPolicy: before.supportPolicy }, after: input });
  },
});


/** CA7/PA9: approve or deny a support request (approval starts a time-boxed, read-only session). */
export const decideSupport = mutate({
  action: "support.decide",
  schema: z.object({ id: z.string().max(26), approve: z.boolean() }),
  run: async ({ p, input, tx, audit }) => {
    const [s] = await tx.select().from(schema.supportSessions).where(and(eq(schema.supportSessions.id, input.id), eq(schema.supportSessions.tenantId, p.tenantId!), eq(schema.supportSessions.status, "requested")));
    if (!s) throw new UserError("This request was already handled or withdrawn.");
    const now = new Date();
    await tx.update(schema.supportSessions).set(input.approve
      ? { status: "active", decidedBy: p.userId, decidedAt: now, startsAt: now, endsAt: new Date(now.getTime() + s.minutes * 6e4), updatedAt: now }
      : { status: "denied", decidedBy: p.userId, decidedAt: now, updatedAt: now }).where(eq(schema.supportSessions.id, s.id));
    await audit(input.approve ? "support.approved" : "support.denied", { sessionId: s.id, staffId: s.staffId, minutes: s.minutes, reason: s.reason });
    return { minutes: s.minutes };
  },
});

/** CA7/PA9: end an active support session now. Revokes engine access immediately (authz bump). */
export const endSupport = mutate({
  action: "support.decide",
  schema: z.object({ id: z.string().max(26) }),
  run: async ({ p, input, tx, audit }) => {
    const [s] = await tx.select().from(schema.supportSessions).where(and(eq(schema.supportSessions.id, input.id), eq(schema.supportSessions.tenantId, p.tenantId!), eq(schema.supportSessions.status, "active")));
    if (!s) throw new UserError("This session already ended.");
    await tx.update(schema.supportSessions).set({ status: "ended", endedBy: p.userId, endsAt: new Date(), updatedAt: new Date() }).where(eq(schema.supportSessions.id, s.id));
    await bumpAuthz(tx, p.tenantId!);
    await audit("support.ended", { sessionId: s.id, staffId: s.staffId });
  },
});
