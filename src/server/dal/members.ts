import "server-only";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { db, schema, type Tx } from "@/server/db/client";
import { forgetEngineTokens } from "@/server/engine/client";
import { UserError } from "@/server/mutate";
import type { EclRole, LeasesRole, Member, WorkspaceRole } from "@/types/domain";

const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
export function ago(d: Date | null, now = Date.now()): string {
  if (!d) return "Never";
  const m = Math.round((now - d.getTime()) / 6e4);
  if (m < 5) return "Now";
  if (m < 60) return `${m} min ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)} h ago`;
  if (m < 60 * 48) return "Yesterday";
  if (m < 60 * 24 * 14) return `${Math.round(m / 1440)} days ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** CA2: members (with per-service roles) + pending invites as "invited" rows. Row id = membership id or `inv:<id>`. */
export async function listMembers(tenantId: string): Promise<Member[]> {
  const rows = await db.select({ m: schema.tenantMemberships, u: schema.users, svc: schema.memberServiceRoles.service, role: schema.memberServiceRoles.role })
    .from(schema.tenantMemberships)
    .innerJoin(schema.users, eq(schema.users.id, schema.tenantMemberships.userId))
    .leftJoin(schema.memberServiceRoles, eq(schema.memberServiceRoles.membershipId, schema.tenantMemberships.id))
    .where(eq(schema.tenantMemberships.tenantId, tenantId));
  const byId = new Map<string, Member>();
  for (const r of rows) {
    const m = byId.get(r.m.id) ?? {
      id: r.m.id, name: r.u.name, initials: initials(r.u.name), email: r.u.email, title: r.u.title ?? undefined,
      workspaceRole: r.m.workspaceRole as WorkspaceRole, ecl: "none" as EclRole, leases: "none" as LeasesRole, mfa: r.u.totpEnabled,
      status: r.m.status === "disabled" || !r.u.isActive ? "disabled" as const : "active" as const, lastActive: ago(r.u.lastLoginAt),
    };
    if (r.svc === "ecl") m.ecl = r.role as EclRole;
    if (r.svc === "leases") m.leases = r.role as LeasesRole;
    byId.set(r.m.id, m);
  }
  const invites = await db.select().from(schema.invitations).where(and(eq(schema.invitations.tenantId, tenantId), eq(schema.invitations.status, "pending"), gt(schema.invitations.expiresAt, new Date())));
  const order = { owner: 0, admin: 1, member: 2 } as const;
  return [
    ...[...byId.values()].sort((a, b) => order[a.workspaceRole] - order[b.workspaceRole] || a.name.localeCompare(b.name)),
    ...invites.map((i): Member => {
      const roles = (i.serviceRoles ?? {}) as Record<string, string>;
      const days = Math.ceil((i.expiresAt.getTime() - Date.now()) / 864e5);
      return { id: `inv:${i.id}`, name: i.email.split("@")[0], initials: initials(i.email), email: i.email, workspaceRole: i.workspaceRole as WorkspaceRole, ecl: (roles.ecl ?? "none") as EclRole, leases: (roles.leases ?? "none") as LeasesRole, mfa: false, status: "invited", lastActive: days <= 1 ? "Expires tomorrow" : `Expires in ${days} days` };
    }),
  ];
}

/** Loads a membership that must belong to `tenantId` (never trust ids from the client). */
export async function membershipIn(tx: Tx, tenantId: string, membershipId: string) {
  const [m] = await tx.select().from(schema.tenantMemberships).where(and(eq(schema.tenantMemberships.id, membershipId), eq(schema.tenantMemberships.tenantId, tenantId)));
  if (!m) throw new UserError("That member isn't in this workspace any more.");
  return m;
}

/** Admins + owner still active, excluding `exceptId` (guards "at least one administrator"). */
export async function remainingAdmins(tx: Tx, tenantId: string, exceptId: string) {
  const rows = await tx.select({ id: schema.tenantMemberships.id }).from(schema.tenantMemberships)
    .where(and(eq(schema.tenantMemberships.tenantId, tenantId), eq(schema.tenantMemberships.status, "active"), inArray(schema.tenantMemberships.workspaceRole, ["owner", "admin"])));
  return rows.filter((r) => r.id !== exceptId).length;
}

/** Any permission change: old engine tokens for this workspace stop working (Python compares `av`). */
export async function bumpAuthz(tx: Tx, tenantId: string) {
  await tx.update(schema.tenants).set({ authzVersion: sql`${schema.tenants.authzVersion} + 1` }).where(eq(schema.tenants.id, tenantId));
  forgetEngineTokens(tenantId);
}
