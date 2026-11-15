import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import type { AuditEvent } from "@/types/domain";
import { codesInText } from "@/lib/code";

const initials = (n: string) => n.split(/[\s.]+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const SERVICE: Record<string, string> = { member: "Workspace", workspace: "Workspace", security: "Workspace", support: "Platform", platform: "Platform", run: "ECL", lease: "Leases" };
const human = (e: string) => e.replace(/^platform\./, "").replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** CA8 / Activity: newest events for a workspace, both services (insert only table). */
export async function listAudit(tenantId: string, limit = 200): Promise<(AuditEvent & { staff?: boolean })[]> {
  const rows = await db.select({ a: schema.auditLogs, name: schema.users.name, staff: schema.users.platformRole })
    .from(schema.auditLogs).leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.userId))
    .where(eq(schema.auditLogs.tenantId, tenantId)).orderBy(desc(schema.auditLogs.createdAt)).limit(limit);
  return rows.map(({ a, name, staff }) => {
    const d = (a.details ?? {}) as Record<string, unknown>;
    const actor = name ?? "System";
    const object = codesInText(String(d.object ?? d.email ?? d.emails ?? d.detail ?? d.service ?? "None"));
    return {
      at: a.createdAt.toISOString(), actor: staff ? `${actor} (Komputy)` : actor, initials: name ? initials(name) : "SY",
      action: /[A-Z ]/.test(a.eventType) ? a.eventType : human(a.eventType), object: object.length > 60 ? `${object.slice(0, 57)}…` : object,
      service: String(d.service ?? SERVICE[a.eventType.split(".")[0]] ?? "Workspace"), staff: Boolean(staff),
    };
  });
}
