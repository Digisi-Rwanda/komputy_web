"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { provisionWorkspace } from "@/server/dal/provision";
import { and, eq } from "drizzle-orm";
import { audit } from "@/server/audit";
import { auth } from "@/server/auth";
import { db, schema } from "@/server/db/client";
import { bumpAuthz, remainingAdmins } from "@/server/dal/members";
import { type ActionResult, UserError } from "@/server/mutate";
import { getPrincipal } from "@/server/session";

/** SH3: switch the active workspace on the current session (no re-login). Membership is checked by Better Auth. */
export async function switchWorkspace(organizationId: string): Promise<{ ok: boolean }> {
  try {
    await auth.api.setActiveOrganization({ body: { organizationId }, headers: await headers() });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** NA5.2: leave a workspace. Owners transfer ownership first; the last administrator can't leave. */
export async function leaveWorkspace(tenantId: string): Promise<ActionResult> {
  const p = await getPrincipal();
  if (!p) return { ok: false, error: "Your session ended. Sign in again." };
  try {
    await db.transaction(async (tx) => {
      const [m] = await tx.select().from(schema.tenantMemberships).where(and(eq(schema.tenantMemberships.tenantId, tenantId), eq(schema.tenantMemberships.userId, p.userId)));
      if (!m) throw new UserError("You're not a member of that workspace.");
      if (m.workspaceRole === "owner") throw new UserError("Owners can't leave. Transfer ownership first (Admin → Danger zone).");
      if (m.workspaceRole === "admin" && (await remainingAdmins(tx, tenantId, m.id)) === 0) throw new UserError("You're the last administrator. Make someone else an administrator first.");
      await tx.delete(schema.tenantMemberships).where(eq(schema.tenantMemberships.id, m.id));
      await tx.update(schema.authSessions).set({ activeOrganizationId: null }).where(and(eq(schema.authSessions.userId, p.userId), eq(schema.authSessions.activeOrganizationId, tenantId)));
      await bumpAuthz(tx, tenantId);
      await audit({ event: "member.left", userId: p.userId, tenantId, details: { role: m.workspaceRole } }, tx);
    });
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof UserError ? e.message : "Couldn't leave the workspace. Try again." };
  }
}

/** A3 "Create a new workspace": signed-in person founds another workspace (14-day trial of one service). */
export async function createMyWorkspace(_: { ok: false; error: string } | null, f: FormData): Promise<{ ok: false; error: string } | null> {
  const p = await getPrincipal();
  if (!p) return { ok: false, error: "Your session ended. Sign in again." };
  const name = String(f.get("company") ?? "").trim(), country = String(f.get("country") ?? "").trim(), service = String(f.get("service") ?? "");
  if (name.length < 2 || name.length > 80) return { ok: false, error: "Enter your company name." };
  if (!country) return { ok: false, error: "Choose your country." };
  if (service !== "ecl" && service !== "leases") return { ok: false, error: "Pick a service to try." };
  const ws = await db.transaction(async (tx) => {
    const r = await provisionWorkspace(tx, { userId: p.userId, name, country, services: [service], emailDomain: p.email.split("@")[1] });
    await audit({ event: "workspace.created", userId: p.userId, tenantId: r.tenantId, details: { via: "picker", service } }, tx);
    return r;
  });
  await auth.api.setActiveOrganization({ body: { organizationId: ws.tenantId }, headers: await headers() });
  redirect("/home?welcome=1");
}
