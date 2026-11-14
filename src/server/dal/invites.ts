import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

/** Public invite preview (A6): only what the invite email already revealed. No session required. */
export async function getInvitePreview(id: string) {
  const [row] = await db.select({ inv: schema.invitations, tenant: schema.tenants.name, inviter: schema.users.name })
    .from(schema.invitations)
    .innerJoin(schema.tenants, eq(schema.tenants.id, schema.invitations.tenantId))
    .innerJoin(schema.users, eq(schema.users.id, schema.invitations.invitedByUserId))
    .where(eq(schema.invitations.id, id)).limit(1);
  if (!row) return null;
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.email, row.inv.email.toLowerCase()), isNull(schema.users.deletedAt))).limit(1);
  return {
    id: row.inv.id, email: row.inv.email, tenant: row.tenant, inviter: row.inviter, inviterInitials: initials(row.inviter),
    workspaceRole: row.inv.workspaceRole, serviceRoles: (row.inv.serviceRoles ?? {}) as Record<string, string>,
    usable: row.inv.status === "pending" && row.inv.expiresAt > new Date(), existingAccount: Boolean(existing),
  };
}
