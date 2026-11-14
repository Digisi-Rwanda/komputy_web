import "server-only";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/server/db/client";
import type { Entitlement, ServiceState, Workspace } from "@/types/domain";

const ROLE_LABEL: Record<string, string> = { owner: "Owner", admin: "Administrator", member: "Member" };

/** Entitlements for a set of workspaces, in the shape the UI already uses (types/domain Entitlement). */
async function entitlementsFor(tenantIds: string[]) {
  if (!tenantIds.length) return new Map<string, Entitlement[]>();
  const rows = await db.select().from(schema.entitlements).where(inArray(schema.entitlements.tenantId, tenantIds));
  const map = new Map<string, Entitlement[]>();
  for (const r of rows) {
    const lim = r.limits as Record<string, number>;
    const limit = r.service === "ecl" ? lim.runs_month : lim.active_leases;
    map.set(r.tenantId, [...(map.get(r.tenantId) ?? []), {
      service: r.service as Entitlement["service"], state: r.state as ServiceState,
      trialEndsAt: r.trialEndsAt?.toISOString().slice(0, 10),
      quota: limit ? { used: 0, limit, unit: r.service === "ecl" ? "runs / month" : "leases" } : undefined, // usage comes from the engine
    }]);
  }
  return map;
}

const toWorkspace = (t: typeof schema.tenants.$inferSelect, ents: Entitlement[]): Workspace => ({
  id: t.id, name: t.name, legalName: t.legalName ?? t.name, initial: t.name.trim()[0]?.toUpperCase() ?? "W", logo: t.logo ?? undefined,
  country: t.country ?? "", currency: t.currency, entitlements: ents,
});

/** Workspaces the user belongs to, most recent first (A3 picker, workspace switcher). */
export const listMyWorkspaces = cache(async (userId: string) => {
  const rows = await db.select({ t: schema.tenants, role: schema.tenantMemberships.workspaceRole, status: schema.tenantMemberships.status, joined: schema.tenantMemberships.joinedAt })
    .from(schema.tenantMemberships)
    .innerJoin(schema.tenants, and(eq(schema.tenants.id, schema.tenantMemberships.tenantId), isNull(schema.tenants.deletedAt)))
    .where(and(eq(schema.tenantMemberships.userId, userId), eq(schema.tenantMemberships.status, "active")))
    .orderBy(desc(schema.tenantMemberships.joinedAt));
  const ents = await entitlementsFor(rows.map((r) => r.t.id));
  return rows.map((r) => ({ ws: toWorkspace(r.t, ents.get(r.t.id) ?? []), role: ROLE_LABEL[r.role] ?? r.role, suspended: r.t.status === "suspended", closing: r.t.status === "closing" }));
});

/** The active workspace with its entitlements (app shell, access states, admin overview). */
export const getWorkspace = cache(async (tenantId: string) => {
  const [t] = await db.select().from(schema.tenants).where(and(eq(schema.tenants.id, tenantId), isNull(schema.tenants.deletedAt)));
  if (!t) return null;
  return { ...toWorkspace(t, (await entitlementsFor([t.id])).get(t.id) ?? []), status: t.status, tenant: t };
});
