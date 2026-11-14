"use server";
import { and, eq } from "drizzle-orm";
import { audit } from "@/server/audit";
import { db, schema } from "@/server/db/client";
import { bumpAuthz } from "@/server/dal/members";
import { TRIAL_LIMITS } from "@/server/dal/provision";
import { env } from "@/server/env";
import { ulid } from "@/server/ids";
import { can } from "@/server/policy";
import { getPrincipal } from "@/server/session";
import { notify, workspaceAdmins } from "@/server/notify";
import { SERVICE_IDS } from "@/lib/validation";
import { service as svcInfo } from "@/lib/services";

export type AccessState = { ok: true; ref: string; to?: string } | { ok: false; error: string } | null;
const svcOk = (s: string): s is (typeof SERVICE_IDS)[number] => (SERVICE_IDS as readonly string[]).includes(s);
const DEFAULT_ROLE: Record<string, string> = { ecl: "Analyst", leases: "Preparer" };
const code = (id: string) => `REQ-${id.slice(-4)}`;

/** AC2 member: ask workspace admins for access to a service (lands in CA5, admins notified). */
export async function askAdmin(_: AccessState, f: FormData): Promise<AccessState> {
  const service = String(f.get("service") ?? ""), note = String(f.get("note") ?? "").trim().slice(0, 500);
  if (!svcOk(service)) return { ok: false, error: "Unknown service." };
  const p = await getPrincipal();
  if (!p?.tenantId || !can(p, "access.request")) return { ok: false, error: "Your session ended. Sign in again." };
  const name = svcInfo(service).name, role = DEFAULT_ROLE[service];
  const id = ulid();
  await db.transaction(async (tx) => {
    const [dupe] = await tx.select({ id: schema.accessRequests.id }).from(schema.accessRequests).where(and(eq(schema.accessRequests.tenantId, p.tenantId!), eq(schema.accessRequests.requesterId, p.userId), eq(schema.accessRequests.service, service), eq(schema.accessRequests.status, "open")));
    if (dupe) return;
    await tx.insert(schema.accessRequests).values({ id, code: code(id), tenantId: p.tenantId!, requesterId: p.userId, kind: role ? "access" : "service", scope: "member", status: "open", service,
      details: { title: `${p.name} asked for ${name}${role ? " access" : ""}`, meta: note ? `“${note}”` : role ? `Role requested: ${role}` : "Service not active in this workspace", current: `ECL ${p.services.ecl} · Leases ${p.services.leases}`, requested: role ? `${name} · ${role}` : name } });
    await notify(await workspaceAdmins(p.tenantId!, tx), { event: "requests", kind: "access", tenantId: p.tenantId!, title: `${p.name} asked for ${name}`, body: note || "New access request", href: "/admin/requests", action: "Review",
      email: { subject: `${p.name} asked for ${name}`, message: { preview: "New access request", headline: `${p.name} asked for ${name}`, paragraphs: [note ? `“${note}”` : `They'd like ${name}${role ? ` as ${role}` : ""}.`], cta: { label: "Review request", href: new URL("/admin/requests", env.BETTER_AUTH_URL).toString() } } } }, tx);
    await audit({ event: "access.requested", userId: p.userId, tenantId: p.tenantId, details: { service } }, tx);
  });
  return { ok: true, ref: code(id), to: "your workspace administrators" };
}

/** AC3 admin: self-serve 14-day trial of a live service the workspace has never had. */
export async function startTrial(_: AccessState, f: FormData): Promise<AccessState> {
  const service = String(f.get("service") ?? "");
  if (!svcOk(service)) return { ok: false, error: "Unknown service." };
  if (f.get("ack") !== "on") return { ok: false, error: "Please confirm you understand trial outputs aren't for statutory reporting." };
  if (service !== "ecl" && service !== "leases") return { ok: false, error: "This service isn't available for trials yet. Join the waitlist instead." };
  const p = await getPrincipal();
  if (!p?.tenantId || !can(p, "services.request")) return { ok: false, error: "Only workspace administrators can start a trial. Ask your admin instead." };
  const id = ulid();
  try {
    await db.transaction(async (tx) => {
      const [cur] = await tx.select().from(schema.entitlements).where(and(eq(schema.entitlements.tenantId, p.tenantId!), eq(schema.entitlements.service, service)));
      if (cur && cur.state !== "requested") throw new Error(cur.state === "trial" ? "A trial is already running." : "This workspace already used its trial. Request access and our team will help.");
      const values = { state: "trial", trialEndsAt: new Date(Date.now() + 14 * 864e5), limits: TRIAL_LIMITS[service], watermark: true, updatedBy: p.userId, updatedAt: new Date() };
      if (cur) await tx.update(schema.entitlements).set(values).where(eq(schema.entitlements.id, cur.id));
      else await tx.insert(schema.entitlements).values({ id, tenantId: p.tenantId!, service, ...values });
      // The admin who starts it can use it straight away.
      await tx.insert(schema.memberServiceRoles).values({ id: ulid(), membershipId: p.membershipId!, service, role: "reviewer" }).onConflictDoNothing();
      await bumpAuthz(tx, p.tenantId!);
      await audit({ event: "trial.started", userId: p.userId, tenantId: p.tenantId, details: { service, days: 14 } }, tx);
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't start the trial." };
  }
  return { ok: true, ref: code(id) };
}

/** AC5: more capacity → request to the account manager (no in-app pricing or payment). */
export async function requestMore(_: AccessState, f: FormData): Promise<AccessState> {
  const option = String(f.get("option") ?? ""), note = String(f.get("note") ?? "").trim().slice(0, 1000);
  if (!["plus20", "plus50", "suite"].includes(option)) return { ok: false, error: "Choose an option." };
  const p = await getPrincipal();
  if (!p?.tenantId || !can(p, "services.request")) return { ok: false, error: "Only workspace administrators can request more capacity." };
  const id = ulid();
  const [t] = await db.select({ name: schema.tenants.name }).from(schema.tenants).where(eq(schema.tenants.id, p.tenantId));
  const what = { plus20: "+20 runs this quarter", plus50: "+50 runs this quarter", suite: "Move to Suite (unlimited runs)" }[option]!;
  await db.transaction(async (tx) => {
    await tx.insert(schema.accessRequests).values({ id, code: code(id), tenantId: p.tenantId!, requesterId: p.userId, kind: "capacity", scope: "platform", status: "new", service: "ecl", source: "Request more drawer", details: { title: `More capacity (${what}) — ecl`, company: t.name, type: "More capacity", services: ["ECL"], size: what, message: note || undefined, contact: `${p.name} · ${p.email}` } });
    await tx.insert(schema.requestEvents).values({ id: ulid(), requestId: id, actorId: p.userId, kind: "created", note: `${what} from ${t.name}` });
    await audit({ event: "services.requested", userId: p.userId, tenantId: p.tenantId, details: { kind: "capacity", option } }, tx);
  });
  return { ok: true, ref: code(id) };
}
