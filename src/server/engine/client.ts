import "server-only";
import { and, eq, gt } from "drizzle-orm";
import createClient, { type Middleware } from "openapi-fetch";
import { auth } from "@/server/auth";
import { db, schema } from "@/server/db/client";
import { env } from "@/server/env";
import type { Principal } from "@/server/policy";
import type { paths } from "./schema";

type Claims = Record<string, unknown>;
const TTL = 4 * 60 * 1000; // tokens live 5 min; reuse for 4 so one never expires mid-request
const cache = new Map<string, { token: string; until: number }>();

/** Claims Python trusts (plan §3.2): tenant, roles, entitlements, authz version, support session. */
export async function engineClaims(p: Principal, tenantId: string | null): Promise<Claims> {
  if (!tenantId) {
    // Staff calling platform endpoints: no workspace, no service roles. Python checks is_platform_admin itself.
    if (!p.staff) throw new Error("Only staff can call the engine without a workspace");
    return { sub: p.userId, staff: p.staff };
  }
  const [tenant] = await db.select({ av: schema.tenants.authzVersion }).from(schema.tenants).where(eq(schema.tenants.id, tenantId));
  const ents = await db.select().from(schema.entitlements).where(eq(schema.entitlements.tenantId, tenantId));
  const svc: Record<string, unknown> = {};
  for (const e of ents) svc[e.service] = { role: p.tenantId === tenantId ? p.services[e.service as "ecl" | "leases"] ?? "none" : "viewer", state: e.state, lim: e.limits, wm: e.watermark };
  let sup: Claims | null = null;
  if (p.tenantId !== tenantId) {
    // Staff reading a client workspace: only with an approved, unexpired support session.
    const [s] = await db.select().from(schema.supportSessions).where(and(eq(schema.supportSessions.tenantId, tenantId), eq(schema.supportSessions.staffId, p.userId), eq(schema.supportSessions.status, "active"), gt(schema.supportSessions.endsAt, new Date())));
    if (!s) throw new Error("No active support session for this workspace");
    sup = { id: s.id, until: Math.floor(s.endsAt!.getTime() / 1000) };
  }
  return { sub: p.userId, tid: tenantId, wr: p.tenantId === tenantId ? p.workspaceRole : null, svc, av: tenant?.av ?? 1, sup };
}

async function tokenFor(p: Principal, tenantId: string | null): Promise<string> {
  const key = `${p.sessionId}:${tenantId ?? "platform"}`, hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.token;
  const now = Math.floor(Date.now() / 1000);
  const { token } = await auth.api.signJWT({ body: { payload: { ...(await engineClaims(p, tenantId)), iat: now, exp: now + 300 } } });
  if (cache.size > 10_000) cache.delete(cache.keys().next().value!);
  cache.set(key, { token, until: Date.now() + TTL });
  return token;
}

/** Drop cached tokens after a role/entitlement change so the next call carries fresh claims. */
export const forgetEngineTokens = (tenantId: string) => { for (const k of cache.keys()) if (k.endsWith(`:${tenantId}`)) cache.delete(k); };

/** Typed client for ECL-Server, authenticated as `p` in `tenantId` (null = staff platform call). Server-to-server only. */
export function engine(p: Principal, tenantId: string | null = p.tenantId) {
  const client = createClient<paths>({ baseUrl: env.ENGINE_URL });
  const authz: Middleware = {
    async onRequest({ request }) {
      request.headers.set("Authorization", `Bearer ${await tokenFor(p, tenantId)}`);
      return request;
    },
  };
  client.use(authz);
  return client;
}

/** Raw authenticated fetch (streams, files) for paths the typed client can't express. Server-side only. */
export async function engineFetch(p: Principal, path: string, init: RequestInit = {}, tenantId: string | null = p.tenantId) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await tokenFor(p, tenantId)}`);
  return fetch(new URL(path, env.ENGINE_URL), { ...init, headers, cache: "no-store" });
}
