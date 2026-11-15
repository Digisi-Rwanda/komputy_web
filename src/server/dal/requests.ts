import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { ago } from "@/server/dal/members";
import type { AccessRequest } from "@/types/domain";

const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const KIND: Record<string, AccessRequest["kind"]> = { access: "grant", role: "role", service: "service" };

/** CA5: member requests for the workspace (open + decided). */
export async function listMemberRequests(tenantId: string): Promise<AccessRequest[]> {
  const rows = await db.select({ r: schema.accessRequests, who: schema.users.name })
    .from(schema.accessRequests).leftJoin(schema.users, eq(schema.users.id, schema.accessRequests.requesterId))
    .where(and(eq(schema.accessRequests.tenantId, tenantId), eq(schema.accessRequests.scope, "member")))
    .orderBy(desc(schema.accessRequests.createdAt)).limit(100);
  return rows.map(({ r, who }) => {
    const d = r.details as Record<string, string | undefined>;
    const name = who ?? "Former member";
    return {
      id: r.id, who: name, initials: initials(name), title: d.title ?? `${name} asked for access`, meta: d.meta ?? "", age: ago(r.createdAt),
      kind: KIND[r.kind] ?? "grant", note: d.note, current: d.current ?? "None", requested: d.requested ?? r.service ?? "None",
      status: r.status as AccessRequest["status"],
    };
  });
}
