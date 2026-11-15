"use server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { schema, type Tx } from "@/server/db/client";
import { bumpAuthz, membershipIn, remainingAdmins } from "@/server/dal/members";
import { enqueueEmail } from "@/server/email/enqueue";
import { env } from "@/server/env";
import { ulid } from "@/server/ids";
import { mutate, UserError } from "@/server/mutate";
import { notify } from "@/server/notify";
import { canChangeRole, ECL_ROLES, LEASES_ROLES } from "@/server/policy";

const id = z.string().min(10).max(26);
const link = (path: string) => new URL(path, env.BETTER_AUTH_URL).toString();

/** CA2 inline role select: ECL or Leases role for one member ("none" removes access). */
export const setServiceRole = mutate({
  action: "members.manage",
  schema: z.discriminatedUnion("service", [
    z.object({ membershipId: id, service: z.literal("ecl"), role: z.enum(ECL_ROLES as [string, ...string[]]) }),
    z.object({ membershipId: id, service: z.literal("leases"), role: z.enum(LEASES_ROLES as [string, ...string[]]) }),
  ]),
  run: async ({ p, input, tx, audit }) => {
    const m = await membershipIn(tx, p.tenantId!, input.membershipId);
    const where = and(eq(schema.memberServiceRoles.membershipId, m.id), eq(schema.memberServiceRoles.service, input.service));
    const [before] = await tx.select({ role: schema.memberServiceRoles.role }).from(schema.memberServiceRoles).where(where);
    await tx.delete(schema.memberServiceRoles).where(where);
    if (input.role !== "none") await tx.insert(schema.memberServiceRoles).values({ id: ulid(), membershipId: m.id, service: input.service, role: input.role });
    await bumpAuthz(tx, p.tenantId!);
    if (m.userId !== p.userId) await notify([m.userId], { event: "role", kind: "workspace", tenantId: p.tenantId!, title: `Your ${input.service === "ecl" ? "ECL" : "Leases"} role is now ${input.role === "none" ? "no access" : input.role}`, body: `Changed by ${p.name}`, href: "/home",
      email: { subject: "Your Komputy access changed", message: { preview: "Your role changed", headline: "Your access changed", paragraphs: [`${p.name} changed your ${input.service === "ecl" ? "Expected Credit Loss" : "Lease Accounting"} role to ${input.role === "none" ? "no access" : input.role}.`], cta: { label: "Open Komputy", href: link("/home") } } } }, tx);
    await audit("member.service_role_changed", { userId: m.userId, service: input.service, before: before?.role ?? "none", after: input.role });
  },
});

/** CA2 row menu: make administrator / make member. The owner role only changes via ownership transfer. */
export const setWorkspaceRole = mutate({
  action: "members.manage",
  schema: z.object({ membershipId: id, role: z.enum(["admin", "member"]) }),
  run: async ({ p, input, tx, audit }) => {
    const m = await membershipIn(tx, p.tenantId!, input.membershipId);
    if (!canChangeRole(p, { workspaceRole: m.workspaceRole as "owner" | "admin" | "member", userId: m.userId }, input.role)) throw new UserError("The owner's role can't be changed here.");
    if (input.role === "member" && (await remainingAdmins(tx, p.tenantId!, m.id)) === 0) throw new UserError("At least one administrator is required.");
    await tx.update(schema.tenantMemberships).set({ workspaceRole: input.role, role: input.role === "admin" ? "administrator" : "analyst", updatedAt: new Date() }).where(eq(schema.tenantMemberships.id, m.id));
    await bumpAuthz(tx, p.tenantId!);
    await notify([m.userId], { event: "role", kind: "workspace", tenantId: p.tenantId!, title: input.role === "admin" ? "You're now a workspace administrator" : "You're now a workspace member", body: `Changed by ${p.name}`, href: "/home",
      email: { subject: "Your Komputy role changed", message: { preview: "Your role changed", headline: input.role === "admin" ? "You're now an administrator" : "Your role changed", paragraphs: [`${p.name} made you a workspace ${input.role === "admin" ? "administrator" : "member"}.`], cta: { label: "Open Komputy", href: link("/home") } } } }, tx);
    await audit("member.role_changed", { userId: m.userId, before: m.workspaceRole, after: input.role });
  },
});

/** CA2: disable / enable access without removing history. */
export const setMemberStatus = mutate({
  action: "members.manage",
  schema: z.object({ membershipId: id, status: z.enum(["active", "disabled"]) }),
  run: async ({ p, input, tx, audit }) => {
    const m = await membershipIn(tx, p.tenantId!, input.membershipId);
    if (m.workspaceRole === "owner") throw new UserError("The owner can't be disabled.");
    if (m.userId === p.userId) throw new UserError("You can't disable yourself.");
    if (input.status === "disabled" && m.workspaceRole === "admin" && (await remainingAdmins(tx, p.tenantId!, m.id)) === 0) throw new UserError("At least one administrator is required.");
    await tx.update(schema.tenantMemberships).set({ status: input.status, updatedAt: new Date() }).where(eq(schema.tenantMemberships.id, m.id));
    // Drop their session's pointer to this workspace so the next request re-checks membership.
    if (input.status === "disabled") await tx.update(schema.authSessions).set({ activeOrganizationId: null }).where(and(eq(schema.authSessions.userId, m.userId), eq(schema.authSessions.activeOrganizationId, p.tenantId!)));
    await bumpAuthz(tx, p.tenantId!);
    await audit(input.status === "disabled" ? "member.disabled" : "member.enabled", { userId: m.userId });
  },
});

export const removeMember = mutate({
  action: "members.manage",
  schema: z.object({ membershipId: id }),
  run: async ({ p, input, tx, audit }) => {
    const m = await membershipIn(tx, p.tenantId!, input.membershipId);
    if (m.workspaceRole === "owner") throw new UserError("The owner can't be removed. Transfer ownership first.");
    if (m.userId === p.userId) throw new UserError("You can't remove yourself. Ask another administrator.");
    if (m.workspaceRole === "admin" && (await remainingAdmins(tx, p.tenantId!, m.id)) === 0) throw new UserError("At least one administrator is required.");
    await tx.delete(schema.tenantMemberships).where(eq(schema.tenantMemberships.id, m.id));
    await tx.update(schema.authSessions).set({ activeOrganizationId: null }).where(and(eq(schema.authSessions.userId, m.userId), eq(schema.authSessions.activeOrganizationId, p.tenantId!)));
    await bumpAuthz(tx, p.tenantId!);
    await audit("member.removed", { userId: m.userId, role: m.workspaceRole });
  },
});

/** CA2 "Require MFA": a reminder email; the hard rule is the workspace policy (CA7). */
export const remindMfa = mutate({
  action: "members.manage",
  schema: z.object({ membershipIds: z.array(id).min(1).max(100) }),
  run: async ({ p, input, tx, audit }) => {
    const rows = await tx.select({ email: schema.users.email, name: schema.users.name, mfa: schema.users.totpEnabled }).from(schema.tenantMemberships)
      .innerJoin(schema.users, eq(schema.users.id, schema.tenantMemberships.userId))
      .where(and(eq(schema.tenantMemberships.tenantId, p.tenantId!), inArray(schema.tenantMemberships.id, input.membershipIds)));
    const targets = rows.filter((r) => !r.mfa);
    for (const r of targets) await enqueueEmail(r.email, "Turn on two factor authentication", { preview: "Protect your Komputy account", headline: "Turn on two factor authentication", paragraphs: [`Hi ${r.name.split(" ")[0]}, your administrator asked you to protect your account with an authenticator app. It takes about a minute.`], cta: { label: "Set up two factor", href: link("/account/security") } }, tx);
    await audit("member.mfa_reminder", { count: targets.length });
    return targets.length;
  },
});

const ROLE_SET = z.object({ ecl: z.enum(ECL_ROLES as [string, ...string[]]), leases: z.enum(LEASES_ROLES as [string, ...string[]]) });

/** CA3 invite: allowed-domain policy, skips current members, 7-day expiry, durable email. */
export const inviteMembers = mutate({
  action: "invites.manage",
  schema: z.object({ emails: z.array(z.email().max(254)).min(1).max(50), workspaceRole: z.enum(["admin", "member"]), roles: ROLE_SET, message: z.string().max(500).optional() }),
  run: async ({ p, input, tx, audit }) => {
    const [t] = await tx.select({ name: schema.tenants.name, domains: schema.tenants.allowedDomains }).from(schema.tenants).where(eq(schema.tenants.id, p.tenantId!));
    const emails = [...new Set(input.emails.map((e) => e.toLowerCase()))];
    const blocked = t.domains.length ? emails.filter((e) => !t.domains.includes(e.split("@")[1])) : [];
    if (blocked.length) throw new UserError(`Only ${t.domains.map((d) => `@${d}`).join(", ")} addresses are allowed (workspace security policy).`);
    const members = await tx.select({ email: schema.users.email }).from(schema.tenantMemberships).innerJoin(schema.users, eq(schema.users.id, schema.tenantMemberships.userId)).where(and(eq(schema.tenantMemberships.tenantId, p.tenantId!), inArray(schema.users.email, emails)));
    const fresh = emails.filter((e) => !members.some((m) => m.email === e));
    if (!fresh.length) throw new UserError("Everyone on the list is already a member.");
    // Re-inviting replaces the previous pending invite for that address.
    await tx.update(schema.invitations).set({ status: "canceled", updatedAt: new Date() }).where(and(eq(schema.invitations.tenantId, p.tenantId!), eq(schema.invitations.status, "pending"), inArray(schema.invitations.email, fresh)));
    for (const email of fresh) {
      const invId = ulid();
      await tx.insert(schema.invitations).values({ id: invId, tenantId: p.tenantId!, email, invitedByUserId: p.userId, role: input.workspaceRole === "admin" ? "administrator" : "analyst", workspaceRole: input.workspaceRole, serviceRoles: input.roles, message: input.message ?? null, status: "pending", expiresAt: new Date(Date.now() + 7 * 864e5) });
      await enqueueEmail(email, `${p.name} invited you to ${t.name} on Komputy`, {
        preview: `Join ${t.name} on Komputy`, headline: `Join ${t.name}`,
        paragraphs: [`${p.name} invited you to ${t.name} on Komputy. The invite expires in 7 days.`, ...(input.message ? [`“${input.message}”`] : []), "If you already have a Komputy account, you'll join with your existing login."],
        cta: { label: "Accept invite", href: link(`/invite/${invId}`) },
      }, tx);
    }
    await audit("member.invited", { emails: fresh, workspaceRole: input.workspaceRole, roles: input.roles });
    return { sent: fresh.length, skipped: emails.length - fresh.length };
  },
});

const invite = async (tx: Tx, tenantId: string, invitationId: string) => {
  const [i] = await tx.select().from(schema.invitations).where(and(eq(schema.invitations.id, invitationId), eq(schema.invitations.tenantId, tenantId), eq(schema.invitations.status, "pending")));
  if (!i) throw new UserError("This invite is no longer pending.");
  return i;
};

export const resendInvite = mutate({
  action: "invites.manage",
  schema: z.object({ invitationId: id }),
  run: async ({ p, input, tx, audit }) => {
    const i = await invite(tx, p.tenantId!, input.invitationId);
    const [t] = await tx.select({ name: schema.tenants.name }).from(schema.tenants).where(eq(schema.tenants.id, p.tenantId!));
    await tx.update(schema.invitations).set({ expiresAt: new Date(Date.now() + 7 * 864e5), updatedAt: new Date() }).where(eq(schema.invitations.id, i.id));
    await enqueueEmail(i.email, `Reminder: join ${t.name} on Komputy`, { preview: `Join ${t.name}`, headline: `Join ${t.name}`, paragraphs: [`${p.name} resent your invite to ${t.name}. It now expires in 7 days.`], cta: { label: "Accept invite", href: link(`/invite/${i.id}`) } }, tx);
    await audit("member.invite_resent", { email: i.email });
  },
});

export const revokeInvite = mutate({
  action: "invites.manage",
  schema: z.object({ invitationId: id }),
  run: async ({ p, input, tx, audit }) => {
    const i = await invite(tx, p.tenantId!, input.invitationId);
    await tx.update(schema.invitations).set({ status: "canceled", updatedAt: new Date() }).where(eq(schema.invitations.id, i.id));
    await audit("member.invite_revoked", { email: i.email });
  },
});
