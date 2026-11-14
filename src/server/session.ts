import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { forbidden, redirect, unauthorized } from "next/navigation";
import { headers } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import { auth } from "@/server/auth";
import { db, schema } from "@/server/db/client";
import { can, type Action, type EclRole, type LeasesRole, type Principal, type StaffRole, type WorkspaceRole } from "@/server/policy";

/** One session lookup per request (React cache), whatever the number of callers. Always request-time. */
export const getSession = cache(async () => {
  await connection();
  return auth.api.getSession({ headers: await headers() });
});

/** Resolves the caller: user, active workspace membership and per-service roles. Null when signed out. */
export const getPrincipal = cache(async (): Promise<Principal | null> => {
  const s = await getSession();
  if (!s) return null;
  const tenantId = (s.session as { activeOrganizationId?: string | null }).activeOrganizationId ?? null;
  const base: Principal = {
    userId: s.user.id, email: s.user.email, name: s.user.name, image: s.user.image ?? null, sessionId: s.session.id,
    mfa: Boolean((s.user as { twoFactorEnabled?: boolean }).twoFactorEnabled),
    staff: ((s.user as { platformRole?: string | null }).platformRole ?? null) as StaffRole | null,
    tenantId: null, membershipId: null, workspaceRole: null, services: { ecl: "none", leases: "none" },
  };
  if (!tenantId) return base;
  const rows = await db.select({ id: schema.tenantMemberships.id, role: schema.tenantMemberships.workspaceRole, svc: schema.memberServiceRoles.service, svcRole: schema.memberServiceRoles.role, requireMfa: schema.tenants.requireMfa, timeoutHours: schema.tenants.sessionTimeoutHours, idle: schema.tenants.idleSignout, tStatus: schema.tenants.status })
    .from(schema.tenantMemberships)
    .innerJoin(schema.tenants, and(eq(schema.tenants.id, schema.tenantMemberships.tenantId), isNull(schema.tenants.deletedAt)))
    .leftJoin(schema.memberServiceRoles, eq(schema.memberServiceRoles.membershipId, schema.tenantMemberships.id))
    .where(and(eq(schema.tenantMemberships.userId, s.user.id), eq(schema.tenantMemberships.tenantId, tenantId), eq(schema.tenantMemberships.status, "active")));
  if (!rows.length) return base; // membership removed/disabled since the session picked this workspace
  const t = rows[0];
  // CA7 workspace policy: sessions older than the workspace's limit end here (staff keep the platform-wide 7 days).
  if (!base.staff && Date.now() - new Date(s.session.createdAt).getTime() > t.timeoutHours * 3600e3) {
    await auth.api.revokeSession({ body: { token: s.session.token }, headers: await headers() }).catch(() => {});
    return null;
  }
  if (t.tStatus === "suspended" && !base.staff) return { ...base, suspended: true };
  const services = { ecl: "none" as EclRole, leases: "none" as LeasesRole };
  for (const r of rows) if (r.svc === "ecl") services.ecl = r.svcRole as EclRole; else if (r.svc === "leases") services.leases = r.svcRole as LeasesRole;
  return { ...base, tenantId, membershipId: t.id, workspaceRole: t.role as WorkspaceRole, services, mfaPending: t.requireMfa && !base.mfa, idleSignout: t.idle };
});

export async function requireUser(): Promise<Principal> {
  const p = await getPrincipal();
  if (!p) unauthorized();
  return p;
}

/**
 * Signed-in member of an active workspace; sends people without one to the workspace picker, and people whose
 * workspace requires MFA to set it up first (account pages pass `allowMfaPending`).
 */
export async function requireMember(action: Action = "workspace.view", opts: { allowMfaPending?: boolean } = {}): Promise<Principal & { tenantId: string; membershipId: string; workspaceRole: WorkspaceRole }> {
  const p = await requireUser();
  if (p.suspended) redirect("/select-workspace?error=suspended");
  if (!p.tenantId || !p.membershipId || !p.workspaceRole) redirect("/select-workspace");
  if (p.mfaPending && !opts.allowMfaPending) redirect("/account/security?mfa=required");
  if (!can(p, action)) forbidden();
  return p as Principal & { tenantId: string; membershipId: string; workspaceRole: WorkspaceRole };
}

export async function requireStaff(action: Action = "platform.view"): Promise<Principal & { staff: StaffRole }> {
  const p = await requireUser();
  if (!can(p, action)) forbidden();
  return p as Principal & { staff: StaffRole };
}
