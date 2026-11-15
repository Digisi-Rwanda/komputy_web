"use server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { audit as writeAudit } from "@/server/audit";
import { schema, type Tx } from "@/server/db/client";
import { bumpAuthz } from "@/server/dal/members";
import { TRIAL_LIMITS } from "@/server/dal/provision";
import { enqueueEmail } from "@/server/email/enqueue";
import { env } from "@/server/env";
import { ulid } from "@/server/ids";
import { mutate, UserError } from "@/server/mutate";
import { notify, workspaceAdmins } from "@/server/notify";
import { can, STAFF_ROLES } from "@/server/policy";

const id = z.string().min(3).max(26);
const SERVICE = z.enum(["ecl", "leases"]);
const NAME = { ecl: "Expected Credit Loss", leases: "Lease Accounting" } as const;
const link = (path: string) => new URL(path, env.BETTER_AUTH_URL).toString();
const staffAudit = (tx: Tx, userId: string, tenantId: string | null, event: string, details: Record<string, unknown>) => writeAudit({ event: `platform.${event}`, userId, tenantId, details: { ...details, staff: true } }, tx);

async function tenantOwner(tx: Tx, tenantId: string) {
  const [o] = await tx.select({ email: schema.users.email, name: schema.users.name, tenant: schema.tenants.name }).from(schema.tenantMemberships)
    .innerJoin(schema.users, eq(schema.users.id, schema.tenantMemberships.userId)).innerJoin(schema.tenants, eq(schema.tenants.id, schema.tenantMemberships.tenantId))
    .where(and(eq(schema.tenantMemberships.tenantId, tenantId), eq(schema.tenantMemberships.workspaceRole, "owner")));
  return o;
}

/** PA4: grant trial · extend · add units · activate · suspend · expire. Sales can only propose (recorded, not applied). */
export const changeEntitlement = mutate({
  action: "entitlements.propose",
  schema: z.object({
    tenantId: id, service: SERVICE, kind: z.enum(["trial", "extend", "units", "activate", "suspend", "expire"]), reason: z.string().trim().min(3, "A reason is required").max(500),
    days: z.number().int().min(1).max(30).optional(), limits: z.record(z.string(), z.number().int().min(0).max(10_000_000)).optional(),
    startsAt: z.iso.date().optional(), endsAt: z.iso.date().optional(), contractRef: z.string().max(60).optional(), priceNote: z.string().max(200).optional(),
    clientMessage: z.string().max(1000).optional(), watermark: z.boolean().optional(), linkedRequest: id.optional(),
  }),
  run: async ({ p, input, tx }) => {
    const [t] = await tx.select().from(schema.tenants).where(eq(schema.tenants.id, input.tenantId));
    if (!t) throw new UserError("Workspace not found.");
    if (!can(p, "entitlements.change")) {
      await tx.insert(schema.workspaceNotes).values({ id: ulid(), tenantId: t.id, authorId: p.userId, body: `Proposed ${input.kind} for ${NAME[input.service]}: ${input.reason}` });
      await staffAudit(tx, p.userId, t.id, "entitlement_proposed", { detail: `${input.service} ${input.kind}`, reason: input.reason });
      return { proposed: true };
    }
    const [cur] = await tx.select().from(schema.entitlements).where(and(eq(schema.entitlements.tenantId, t.id), eq(schema.entitlements.service, input.service)));
    const now = new Date();
    const patch: Partial<typeof schema.entitlements.$inferInsert> = { updatedBy: p.userId, updatedAt: now };
    switch (input.kind) {
      case "trial":
        Object.assign(patch, { state: "trial", trialEndsAt: new Date(now.getTime() + (input.days ?? 14) * 864e5), limits: input.limits ?? TRIAL_LIMITS[input.service], watermark: input.watermark ?? true });
        break;
      case "extend":
        if (cur?.state !== "trial" && cur?.state !== "trial-expired") throw new UserError("Only trials can be extended.");
        Object.assign(patch, { state: "trial", trialEndsAt: new Date(Math.max(cur.trialEndsAt?.getTime() ?? 0, now.getTime()) + (input.days ?? 7) * 864e5) });
        break;
      case "units":
        if (cur?.state !== "active") throw new UserError("Add units to an active service.");
        Object.assign(patch, { limits: { ...(cur.limits as object), ...input.limits } });
        break;
      case "activate":
        if (!input.startsAt || !input.endsAt || input.endsAt <= input.startsAt) throw new UserError("Give a contract start and end date.");
        Object.assign(patch, { state: "active", startsAt: new Date(input.startsAt), endsAt: new Date(`${input.endsAt}T23:59:59Z`), trialEndsAt: null, limits: input.limits ?? cur?.limits ?? TRIAL_LIMITS[input.service], watermark: false, contractRef: input.contractRef ?? null, priceNote: input.priceNote ?? null, clientMessage: null });
        break;
      case "suspend": case "expire":
        if (!cur) throw new UserError("This service isn't enabled.");
        Object.assign(patch, { state: input.kind === "suspend" ? "suspended" : "expired", clientMessage: input.clientMessage ?? null });
    }
    if (cur) await tx.update(schema.entitlements).set(patch).where(eq(schema.entitlements.id, cur.id));
    else await tx.insert(schema.entitlements).values({ id: ulid(), tenantId: t.id, service: input.service, state: "trial", limits: {}, ...patch } as typeof schema.entitlements.$inferInsert);
    if (input.kind === "activate" && t.status === "trial") await tx.update(schema.tenants).set({ status: "active", plan: "growth", updatedAt: now }).where(eq(schema.tenants.id, t.id));
    if (input.linkedRequest) {
      await tx.update(schema.accessRequests).set({ status: "won", updatedAt: now }).where(eq(schema.accessRequests.id, input.linkedRequest));
      await tx.insert(schema.requestEvents).values({ id: ulid(), requestId: input.linkedRequest, actorId: p.userId, kind: "moved", note: `Won · ${input.kind} ${NAME[input.service]}` });
    }
    await bumpAuthz(tx, t.id);
    const verb = { trial: "trial started", extend: "trial extended", units: "capacity updated", activate: "is now active", suspend: "was suspended", expire: "has ended" }[input.kind];
    const ent = input.kind === "trial" || input.kind === "extend" ? "trial" : "service";
    await notify(await workspaceAdmins(t.id, tx), { event: ent, kind: "access", tenantId: t.id, title: `${NAME[input.service]} ${verb}`, body: input.kind === "suspend" || input.kind === "expire" ? (input.clientMessage ?? "Data stays available read-only.") : `Changes apply straight away.`, href: "/admin/services", email: { subject: `${NAME[input.service]} ${verb}`, message: {
      preview: `${NAME[input.service]} ${verb}`, headline: `${NAME[input.service]} ${verb}`,
      paragraphs: [input.kind === "suspend" || input.kind === "expire" ? (input.clientMessage ?? "Your data stays available read-only. Contact your account manager to continue.") : `Changes to ${t.name} apply straight away.`],
      details: [["Service", NAME[input.service]], ...(patch.endsAt ? [["Until", (patch.endsAt as Date).toISOString().slice(0, 10)] as [string, string]] : []), ...(patch.trialEndsAt ? [["Trial ends", (patch.trialEndsAt as Date).toISOString().slice(0, 10)] as [string, string]] : []), ...(input.contractRef ? [["Ref", input.contractRef] as [string, string]] : [])],
      cta: { label: `Go to ${NAME[input.service]}`, href: link(input.service === "ecl" ? "/ecl" : "/leases") },
    } } }, tx);
    await staffAudit(tx, p.userId, t.id, `entitlement_${input.kind}`, { detail: `${NAME[input.service]}${input.days ? ` +${input.days} d` : ""}`, reason: input.reason, before: cur?.state ?? "none" });
    return { proposed: false };
  },
});

/** PA3 whole-workspace suspend / reactivate (non-payment, abuse). Members are locked out; data is kept. */
export const setWorkspaceStatus = mutate({
  action: "tenants.manage",
  schema: z.object({ tenantId: z.string().max(26), suspend: z.boolean(), reason: z.string().trim().min(3).max(500) }),
  run: async ({ p, input, tx }) => {
    const [t] = await tx.select().from(schema.tenants).where(eq(schema.tenants.id, input.tenantId));
    if (!t || t.deletedAt) throw new UserError("Workspace not found.");
    if (t.status === "closing") throw new UserError("This workspace is closing; cancel the closure first.");
    if (input.suspend === (t.status === "suspended")) throw new UserError(input.suspend ? "Already suspended." : "This workspace isn't suspended.");
    const [paid] = await tx.select({ id: schema.entitlements.id }).from(schema.entitlements).where(and(eq(schema.entitlements.tenantId, t.id), eq(schema.entitlements.state, "active"))).limit(1);
    const status = input.suspend ? "suspended" : paid ? "active" : "trial";
    await tx.update(schema.tenants).set({ status, updatedAt: new Date() }).where(eq(schema.tenants.id, t.id));
    await tx.update(schema.authSessions).set({ activeOrganizationId: null }).where(eq(schema.authSessions.activeOrganizationId, t.id)).then(() => undefined, () => undefined);
    await bumpAuthz(tx, t.id);
    const owner = await tenantOwner(tx, t.id);
    if (owner) await enqueueEmail(owner.email, input.suspend ? `${t.name} was suspended` : `${t.name} is active again`, {
      preview: input.suspend ? "Workspace suspended" : "Workspace reactivated", headline: input.suspend ? `${t.name} was suspended` : `${t.name} is active again`,
      paragraphs: input.suspend ? ["Members can't open the workspace for now. Your data is kept safely.", "Contact your account manager to restore access."] : ["Everyone can sign in and work as before."],
      cta: { label: "Open Komputy", href: link("/select-workspace") },
    }, tx);
    await staffAudit(tx, p.userId, t.id, input.suspend ? "workspace_suspended" : "workspace_reactivated", { reason: input.reason, before: t.status });
    return { status };
  },
});

/** PA2 "Create workspace": tenant + owner invite (the owner signs up or joins with an existing login). */
export const createWorkspace = mutate({
  action: "tenants.manage",
  schema: z.object({ name: z.string().trim().min(2).max(80), ownerEmail: z.email().max(254), country: z.string().max(64) }),
  run: async ({ p, input, tx }) => {
    const id = ulid(), invId = ulid(), email = input.ownerEmail.toLowerCase();
    const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30)}-${id.slice(-5).toLowerCase()}`;
    await tx.insert(schema.tenants).values({ id, name: input.name, slug, legalName: input.name, country: input.country, plan: "trial", status: "trial", allowedDomains: [email.split("@")[1]] });
    await tx.insert(schema.invitations).values({ id: invId, tenantId: id, email, invitedByUserId: p.userId, role: "administrator", workspaceRole: "owner", serviceRoles: { ecl: "reviewer", leases: "reviewer" }, status: "pending", expiresAt: new Date(Date.now() + 14 * 864e5) });
    await enqueueEmail(email, `Your Komputy workspace for ${input.name} is ready`, { preview: "Your workspace is ready", headline: "Your workspace is ready", paragraphs: [`${p.name} at Komputy created ${input.name} for you. Accept to become its owner. The link works for 14 days.`], cta: { label: "Open your workspace", href: link(`/invite/${invId}`) } }, tx);
    await staffAudit(tx, p.userId, id, "workspace_created", { detail: input.name, reason: `Owner invite to ${email}` });
    return { id };
  },
});

export const setAccountManager = mutate({
  action: "pipeline.manage",
  schema: z.object({ tenantId: id, userId: id.nullable() }),
  run: async ({ p, input, tx }) => {
    if (input.userId) { const [s] = await tx.select({ r: schema.users.platformRole }).from(schema.users).where(eq(schema.users.id, input.userId)); if (!s?.r) throw new UserError("Account managers must be Komputy staff."); }
    await tx.update(schema.tenants).set({ accountManagerId: input.userId, updatedAt: new Date() }).where(eq(schema.tenants.id, input.tenantId));
    await staffAudit(tx, p.userId, input.tenantId, "account_manager_set", { detail: input.userId ?? "unassigned" });
  },
});

export const addWorkspaceNote = mutate({
  action: "notes.write",
  schema: z.object({ tenantId: id, body: z.string().trim().min(1).max(2000) }),
  run: async ({ p, input, tx }) => { await tx.insert(schema.workspaceNotes).values({ id: ulid(), tenantId: input.tenantId, authorId: p.userId, body: input.body }); },
});

/** PA5 pipeline: move stage, add note, assign. */
export const updateLead = mutate({
  action: "pipeline.manage",
  schema: z.object({ id, stage: z.enum(["new", "contacted", "negotiating", "won", "lost"]).optional(), note: z.string().trim().max(1000).optional(), assigneeId: id.nullable().optional() }),
  run: async ({ p, input, tx }) => {
    const [r] = await tx.select().from(schema.accessRequests).where(and(eq(schema.accessRequests.id, input.id), eq(schema.accessRequests.scope, "platform")));
    if (!r) throw new UserError("Request not found.");
    await tx.update(schema.accessRequests).set({ ...(input.stage && { status: input.stage }), ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }), updatedAt: new Date() }).where(eq(schema.accessRequests.id, r.id));
    if (input.stage) await tx.insert(schema.requestEvents).values({ id: ulid(), requestId: r.id, actorId: p.userId, kind: "moved", note: `Moved to ${input.stage}` });
    if (input.note) await tx.insert(schema.requestEvents).values({ id: ulid(), requestId: r.id, actorId: p.userId, kind: "note", note: input.note });
    if (input.stage) await staffAudit(tx, p.userId, r.tenantId, "request_moved", { detail: `${r.code} → ${input.stage}` });
  },
});

/** PA7 staff + people. */
export const setStaffRole = mutate({
  action: "staff.manage",
  schema: z.object({ userId: id, role: z.enum(STAFF_ROLES as [string, ...string[]]) }),
  run: async ({ p, input, tx }) => {
    if (input.userId === p.userId) throw new UserError("You can't change your own role.");
    await tx.update(schema.users).set({ platformRole: input.role, isPlatformAdmin: input.role === "admin", updatedAt: new Date() }).where(and(eq(schema.users.id, input.userId), sql`${schema.users.platformRole} is not null`));
    await staffAudit(tx, p.userId, null, "staff_role_changed", { detail: `${input.userId} → ${input.role}` });
  },
});

export const setUserActive = mutate({
  action: "users.manage",
  schema: z.object({ userId: id, active: z.boolean(), reason: z.string().trim().min(3).max(500) }),
  run: async ({ p, input, tx }) => {
    if (input.userId === p.userId) throw new UserError("You can't disable yourself.");
    await tx.update(schema.users).set({ isActive: input.active, updatedAt: new Date() }).where(eq(schema.users.id, input.userId));
    if (!input.active) await tx.delete(schema.authSessions).where(eq(schema.authSessions.userId, input.userId));
    await staffAudit(tx, p.userId, null, input.active ? "user_enabled" : "user_disabled", { detail: input.userId, reason: input.reason });
  },
});

/** PA3/PA7 "Reset MFA (requires verification note)": removes the authenticator so the person enrols again. */
export const resetUserMfa = mutate({
  action: "users.manage",
  schema: z.object({ userId: id, note: z.string().trim().min(10, "Describe how you verified the person (min 10 characters)").max(500) }),
  run: async ({ p, input, tx }) => {
    await tx.delete(schema.authTwoFactor).where(eq(schema.authTwoFactor.userId, input.userId));
    await tx.update(schema.users).set({ totpEnabled: false, updatedAt: new Date() }).where(eq(schema.users.id, input.userId));
    await tx.delete(schema.authSessions).where(eq(schema.authSessions.userId, input.userId));
    await staffAudit(tx, p.userId, null, "mfa_reset", { detail: input.userId, reason: input.note });
  },
});

/** PA6 catalog: save draft / publish to /pricing. */
const CATALOG = z.object({
  services: z.array(z.object({ name: z.string().max(60), status: z.enum(["live", "soon", "hidden"]) })).max(20),
  packages: z.array(z.object({ name: z.string().trim().min(1).max(40), price: z.string().max(40), unit: z.string().max(40), detail: z.string().max(200), cta: z.string().trim().min(1).max(24), featured: z.boolean(), features: z.array(z.string().max(80)).max(12) })).min(1).max(6),
  trialDefaults: z.array(z.tuple([z.string(), z.string()])).max(6),
});
export const saveCatalog = mutate({
  action: "catalog.publish",
  schema: z.object({ draft: CATALOG, publish: z.boolean() }),
  run: async ({ p, input, tx }) => {
    if (input.draft.packages.filter((x) => x.featured).length > 1) throw new UserError("Only one package can be marked Most popular.");
    const now = new Date();
    await tx.insert(schema.catalog).values({ id: "main", draft: input.draft, published: input.draft, publishedAt: now, publishedBy: p.userId })
      .onConflictDoUpdate({ target: schema.catalog.id, set: { draft: input.draft, ...(input.publish && { published: input.draft, publishedAt: now, publishedBy: p.userId }), updatedAt: now } });
    if (input.publish) await staffAudit(tx, p.userId, null, "catalog_published", { detail: `${input.draft.packages.length} packages` });
  },
  tags: (_, input) => (input.publish ? ["catalog"] : []),
});

/** PA9 staff side: request time-boxed support access (client policy decides: ask / auto ≤ 1 h / never). */
export const requestSupport = mutate({
  action: "support.request",
  schema: z.object({ tenantId: id, reason: z.string().trim().min(10, "Give a specific reason (min 10 characters)").max(300), minutes: z.union([z.literal(30), z.literal(60), z.literal(120)]) }),
  run: async ({ p, input, tx }) => {
    const [t] = await tx.select().from(schema.tenants).where(eq(schema.tenants.id, input.tenantId));
    if (!t) throw new UserError("Workspace not found.");
    if (t.supportPolicy === "never") throw new UserError("This workspace doesn't allow support access.");
    const [open] = await tx.select({ id: schema.supportSessions.id }).from(schema.supportSessions).where(and(eq(schema.supportSessions.tenantId, t.id), eq(schema.supportSessions.staffId, p.userId), inArray(schema.supportSessions.status, ["requested", "active"])));
    if (open) throw new UserError("You already have a pending or active session here.");
    const auto = t.supportPolicy === "auto" && input.minutes <= 60, now = new Date();
    await tx.insert(schema.supportSessions).values({ id: ulid(), tenantId: t.id, staffId: p.userId, reason: input.reason, minutes: input.minutes, status: auto ? "active" : "requested", ...(auto && { startsAt: now, endsAt: new Date(now.getTime() + input.minutes * 6e4), decidedAt: now }) });
    if (!auto) {
      await notify(await workspaceAdmins(t.id, tx), { event: "support", kind: "security", tenantId: t.id, title: `${p.name} (Komputy Support) requests access`, body: `${input.reason} · ${input.minutes} min`, href: "/admin/security", action: "Review",
        email: { subject: `Komputy Support asks to access ${t.name}`, message: { preview: "Support access request", headline: "Support asks for access", paragraphs: [`${p.name} from Komputy Support asks for ${input.minutes} minutes of read-only access to ${t.name}.`, `Reason: ${input.reason}`, "Nothing happens unless an administrator approves."], cta: { label: "Review request", href: link("/admin/security") } } } }, tx);
    }
    await staffAudit(tx, p.userId, t.id, "support_requested", { detail: `${input.minutes} min`, reason: input.reason, auto });
    return { status: auto ? "active" : "requested" };
  },
});

export const endMySupport = mutate({
  action: "support.request",
  schema: z.object({ tenantId: id }),
  run: async ({ p, input, tx }) => {
    const rows = await tx.update(schema.supportSessions).set({ status: sql`case when ${schema.supportSessions.status} = 'requested' then 'cancelled' else 'ended' end`, endedBy: p.userId, endsAt: new Date(), updatedAt: new Date() })
      .where(and(eq(schema.supportSessions.tenantId, input.tenantId), eq(schema.supportSessions.staffId, p.userId), inArray(schema.supportSessions.status, ["requested", "active"]))).returning({ id: schema.supportSessions.id });
    if (!rows.length) throw new UserError("No open session.");
    await bumpAuthz(tx, input.tenantId);
    await staffAudit(tx, p.userId, input.tenantId, "support_ended", {});
  },
});
