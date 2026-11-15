"use server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@/server/db/client";
import { bumpAuthz } from "@/server/dal/members";
import { enqueueEmail } from "@/server/email/enqueue";
import { env } from "@/server/env";
import { ulid } from "@/server/ids";
import { validImage } from "@/server/image";
import { mutate, UserError } from "@/server/mutate";
import { passwordMatches } from "@/server/stepup";

/** CA6 workspace profile. Currency affects new runs only (runs keep their own currency). */
export const updateWorkspaceProfile = mutate({
  action: "workspace.update",
  schema: z.object({ name: z.string().trim().min(2, "Workspace name is required").max(80), legalName: z.string().trim().max(120), country: z.string().max(64), currency: z.enum(["RWF", "USD", "KES", "UGX", "TZS", "EUR"]), fiscalYearEnd: z.enum(["12-31", "06-30", "03-31"]), cadence: z.enum(["monthly", "quarterly"]) }),
  run: async ({ p, input, tx, audit }) => {
    await tx.update(schema.tenants).set({ name: input.name, legalName: input.legalName || input.name, country: input.country, currency: input.currency, fiscalYearEnd: input.fiscalYearEnd, reportingCadence: input.cadence, updatedAt: new Date() }).where(eq(schema.tenants.id, p.tenantId!));
    await audit("workspace.profile_updated", input);
  },
});

/** CA6 workspace logo (null removes it). */
export const setWorkspaceLogo = mutate({
  action: "workspace.update",
  schema: z.object({ logo: z.string().max(280_000).nullable() }),
  run: async ({ p, input, tx, audit }) => {
    const logo = input.logo === null ? null : validImage(input.logo);
    if (input.logo !== null && !logo) throw new UserError("Use a PNG, JPEG or WebP image under 200 KB.");
    await tx.update(schema.tenants).set({ logo, updatedAt: new Date() }).where(eq(schema.tenants.id, p.tenantId!));
    await audit(logo ? "workspace.logo_updated" : "workspace.logo_removed", {});
  },
});

/** CA4 levers: every change to entitlements is a request to Komputy (client entitlements are read-only). */
export const requestService = mutate({
  action: "services.request",
  schema: z.object({ kind: z.enum(["capacity", "access", "extend", "waitlist"]), service: z.enum(["ecl", "leases", "tax", "lease-planning", "doc-intel", "erp"]), need: z.string().max(40).optional(), amount: z.number().int().positive().max(100000).optional(), note: z.string().max(1000).optional() }),
  run: async ({ p, input, tx, audit }) => {
    const [t] = await tx.select({ name: schema.tenants.name }).from(schema.tenants).where(eq(schema.tenants.id, p.tenantId!));
    const open = await tx.select({ id: schema.accessRequests.id }).from(schema.accessRequests).where(and(eq(schema.accessRequests.tenantId, p.tenantId!), eq(schema.accessRequests.scope, "platform"), eq(schema.accessRequests.kind, input.kind === "extend" ? "trial" : input.kind), eq(schema.accessRequests.service, input.service), eq(schema.accessRequests.status, "new")));
    if (open.length) throw new UserError("You already have an open request for this. We'll be in touch within 1 business day.");
    const title = { capacity: `More capacity (${input.need ?? "runs"}${input.amount ? ` → ${input.amount}` : ""})`, access: "Request full access", extend: "Extend trial", waitlist: "Join waitlist" }[input.kind];
    const id = ulid();
    await tx.insert(schema.accessRequests).values({ id, code: `REQ-${id.slice(-4)}`, tenantId: p.tenantId!, requesterId: p.userId, kind: input.kind === "extend" ? "trial" : input.kind, scope: "platform", status: "new", service: input.service, source: "Services & usage", details: { title: `${title} · ${input.service}`, company: t.name, type: title, services: [input.service], size: input.amount ? String(input.amount) : "", message: input.note, contact: `${p.name} · ${p.email}` } });
    await tx.insert(schema.requestEvents).values({ id: ulid(), requestId: id, actorId: p.userId, kind: "created", note: `${title} from ${t.name}` });
    await audit("services.requested", { kind: input.kind, service: input.service, requestId: id });
  },
});

/** CA9: transfer ownership to an active administrator (password step-up). */
export const transferOwnership = mutate({
  action: "ownership.transfer",
  schema: z.object({ membershipId: z.string().max(26), password: z.string().min(1).max(128) }),
  run: async ({ p, input, tx, audit }) => {
    if (!(await passwordMatches(p.userId, input.password))) throw new UserError("Your password is incorrect.");
    const [to] = await tx.select().from(schema.tenantMemberships).where(and(eq(schema.tenantMemberships.id, input.membershipId), eq(schema.tenantMemberships.tenantId, p.tenantId!), eq(schema.tenantMemberships.status, "active")));
    if (!to || to.workspaceRole !== "admin") throw new UserError("Choose an active administrator.");
    await tx.update(schema.tenantMemberships).set({ workspaceRole: "owner", updatedAt: new Date() }).where(eq(schema.tenantMemberships.id, to.id));
    await tx.update(schema.tenantMemberships).set({ workspaceRole: "admin", updatedAt: new Date() }).where(eq(schema.tenantMemberships.id, p.membershipId!));
    await bumpAuthz(tx, p.tenantId!);
    const [[u], [t]] = await Promise.all([tx.select({ email: schema.users.email, name: schema.users.name }).from(schema.users).where(eq(schema.users.id, to.userId)), tx.select({ name: schema.tenants.name }).from(schema.tenants).where(eq(schema.tenants.id, p.tenantId!))]);
    await enqueueEmail(u.email, `You're now the owner of ${t.name}`, { preview: "Ownership transferred", headline: `You own ${t.name} now`, paragraphs: [`${p.name} transferred ownership of ${t.name} to you. You have full control, including billing contacts and closing the workspace.`], cta: { label: "Open Komputy", href: new URL("/admin/overview", env.BETTER_AUTH_URL).toString() } }, tx);
    await audit("workspace.ownership_transferred", { to: to.userId });
  },
});

/** CA9: start the 30-day closing period (data deleted afterwards by the purge job), or cancel it. */
export const setWorkspaceClosing = mutate({
  action: "workspace.close",
  schema: z.object({ close: z.boolean(), password: z.string().max(128).optional(), confirmName: z.string().max(120).optional() }),
  run: async ({ p, input, tx, audit }) => {
    const [t] = await tx.select().from(schema.tenants).where(eq(schema.tenants.id, p.tenantId!));
    if (input.close) {
      if (input.confirmName !== t.name) throw new UserError("Type the workspace name exactly to confirm.");
      if (!(await passwordMatches(p.userId, input.password ?? ""))) throw new UserError("Your password is incorrect.");
      await tx.update(schema.tenants).set({ status: "closing", closeRequestedAt: new Date(), closeRequestedBy: p.userId, updatedAt: new Date() }).where(eq(schema.tenants.id, t.id));
    } else {
      if (t.status !== "closing") throw new UserError("This workspace isn't closing.");
      await tx.update(schema.tenants).set({ status: t.plan === "trial" ? "trial" : "active", closeRequestedAt: null, closeRequestedBy: null, updatedAt: new Date() }).where(eq(schema.tenants.id, t.id));
    }
    await bumpAuthz(tx, p.tenantId!);
    await audit(input.close ? "workspace.closing_started" : "workspace.closing_cancelled", {});
    return { purgeOn: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) };
  },
});
