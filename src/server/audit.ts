import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db, schema, type Tx } from "@/server/db/client";
import { env } from "@/server/env";
import { ulid } from "@/server/ids";

const h = (v: string | null) => (v ? createHash("sha256").update(env.IP_HASH_SALT + v).digest("hex").slice(0, 32) : null);

/** Request fingerprint stored with audit rows: hashed, never the raw IP (same approach as ECL-Server). */
export async function requestMeta() {
  const hd = await headers();
  const ip = hd.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hd.get("x-real-ip");
  return { ipHash: h(ip), uaHash: h(hd.get("user-agent")), userAgent: hd.get("user-agent") ?? "" };
}

export interface AuditEvent { event: string; userId: string | null; tenantId: string | null; details?: Record<string, unknown>; status?: "success" | "failure"; errorCode?: string }

/** Insert-only audit trail shared with ECL-Server (same table). Call inside the mutation's transaction. */
export async function audit(e: AuditEvent, tx?: Tx) {
  const m = await requestMeta().catch(() => ({ ipHash: null, uaHash: null }));
  await (tx ?? db).insert(schema.auditLogs).values({
    id: ulid(), userId: e.userId, tenantId: e.tenantId, eventType: e.event, status: e.status ?? "success",
    ipAddressHash: m.ipHash, userAgentHash: m.uaHash, details: e.details ?? {}, errorCode: e.errorCode ?? null,
  });
}
