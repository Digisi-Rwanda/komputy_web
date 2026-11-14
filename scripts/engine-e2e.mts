// End-to-end: Next mints → Python verifies via JWKS → tenant check → real endpoint. Run with Next + API up.
import assert from "node:assert/strict";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { engine } from "@/server/engine/client";
import type { Principal } from "@/server/policy";

const [m] = await db.select().from(schema.tenantMemberships).orderBy(desc(schema.tenantMemberships.createdAt)).limit(1);
const [u] = await db.select().from(schema.users).where(eq(schema.users.id, m.userId));
const p: Principal = { userId: u.id, email: u.email, name: u.name, sessionId: "e2e", mfa: false, staff: null, tenantId: m.tenantId, membershipId: m.id, workspaceRole: "owner", services: { ecl: "reviewer", leases: "none" } };

const ok = await engine(p).GET("/api/v1/tenants/{tenant_id}/runs", { params: { path: { tenant_id: m.tenantId } } });
assert.equal(ok.response.status, 200, JSON.stringify(ok.error));
console.log("own workspace: 200", JSON.stringify(ok.data).slice(0, 80));

const other = await engine(p).GET("/api/v1/tenants/{tenant_id}/runs", { params: { path: { tenant_id: "01KA1BSGM0SOMEONEELSE00000" } } });
assert.equal(other.response.status, 403, "token for tenant A must not open tenant B");
console.log("other workspace: 403");

await db.update(schema.tenants).set({ authzVersion: 2 }).where(eq(schema.tenants.id, m.tenantId));
const old = await engine(p).GET("/api/v1/tenants/{tenant_id}/runs", { params: { path: { tenant_id: m.tenantId } } }); // cached token, av=1
assert.equal(old.response.status, 401, "token minted before the bump is rejected");
console.log("authz_version bump: old token 401");
const stale = await engine({ ...p, sessionId: "e2e-2" }).GET("/api/v1/tenants/{tenant_id}/runs", { params: { path: { tenant_id: m.tenantId } } });
await db.update(schema.tenants).set({ authzVersion: 1 }).where(eq(schema.tenants.id, m.tenantId));
assert.equal(stale.response.status, 200, "fresh token carries the new av");
console.log("authz_version bump: fresh token accepted");
process.exit(0);
