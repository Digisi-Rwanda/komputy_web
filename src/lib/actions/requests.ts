"use server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@/server/db/client";
import { bumpAuthz } from "@/server/dal/members";
import { ulid } from "@/server/ids";
import { mutate, UserError } from "@/server/mutate";
import { notify } from "@/server/notify";
import { ECL_ROLES, LEASES_ROLES } from "@/server/policy";

const ROLE_OF = (requested: string) => requested.split("·").pop()!.trim().toLowerCase();

/** CA5: approve (grants the requested role), decline, or forward a service request to Ledgerline sales. */
export const decideRequest = mutate({
  action: "requests.decide",
  schema: z.object({ id: z.string().max(26), decision: z.enum(["approved", "declined", "forwarded"]), reply: z.string().max(500).optional() }),
  run: async ({ p, input, tx, audit }) => {
    const [r] = await tx.select().from(schema.accessRequests).where(and(eq(schema.accessRequests.id, input.id), eq(schema.accessRequests.tenantId, p.tenantId!), eq(schema.accessRequests.scope, "member")));
    if (!r || r.status !== "open") throw new UserError("This request was already handled.");
    const d = r.details as Record<string, string>;
    if (input.decision === "approved") {
      if (r.kind === "service") throw new UserError("This service isn't active in the workspace. Forward it to Ledgerline instead.");
      if (r.requesterId === p.userId) throw new UserError("You can't approve your own request.");
      const svc = r.service as "ecl" | "leases", role = ROLE_OF(d.requested ?? "");
      if (!(svc === "ecl" ? ECL_ROLES : LEASES_ROLES).includes(role as never)) throw new UserError("This request doesn't name a valid role.");
      const [m] = await tx.select().from(schema.tenantMemberships).where(and(eq(schema.tenantMemberships.tenantId, p.tenantId!), eq(schema.tenantMemberships.userId, r.requesterId!)));
      if (!m) throw new UserError("The requester is no longer a member.");
      await tx.delete(schema.memberServiceRoles).where(and(eq(schema.memberServiceRoles.membershipId, m.id), eq(schema.memberServiceRoles.service, svc)));
      await tx.insert(schema.memberServiceRoles).values({ id: ulid(), membershipId: m.id, service: svc, role });
      await bumpAuthz(tx, p.tenantId!);
    }
    if (input.decision === "forwarded") {
      const [t] = await tx.select({ name: schema.tenants.name }).from(schema.tenants).where(eq(schema.tenants.id, p.tenantId!));
      const id = ulid();
      await tx.insert(schema.accessRequests).values({ id, code: `REQ-${id.slice(-4)}`, tenantId: p.tenantId!, requesterId: r.requesterId, kind: "service", scope: "platform", status: "new", service: r.service, source: `Forwarded by ${p.name}`, details: { company: t.name, type: "Forwarded", services: [d.requested ?? r.service], size: "Member-forwarded", message: input.reply } });
      await tx.insert(schema.requestEvents).values({ id: ulid(), requestId: id, actorId: p.userId, kind: "created", note: `Forwarded from ${t.name} by ${p.name}` });
    }
    await tx.update(schema.accessRequests).set({ status: input.decision, updatedAt: new Date() }).where(eq(schema.accessRequests.id, r.id));
    await tx.insert(schema.requestEvents).values({ id: ulid(), requestId: r.id, actorId: p.userId, kind: "decided", note: input.reply ?? input.decision });
    if (r.requesterId) await notify([r.requesterId], {
      event: "requests", kind: "access", tenantId: p.tenantId!,
      title: input.decision === "approved" ? `Your request was approved: ${d.requested}` : input.decision === "declined" ? `Your request was declined: ${d.requested}` : `Your request was forwarded to Ledgerline`,
      body: input.reply ? `${p.name}: “${input.reply}”` : `by ${p.name}`, href: "/home",
    }, tx);
    await audit(`request.${input.decision}`, { requestId: r.id, kind: r.kind, service: r.service, requested: d.requested });
  },
});
