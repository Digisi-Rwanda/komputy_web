// Phase 0.1 spike: proves Better Auth works on the existing ECL-Server tables. Run: npm run spike
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRemoteJWKSet, jwtVerify, createLocalJWKSet } from "jose";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db, schema } from "@/server/db/client";
import { fernetDecrypt } from "@/server/fernet";
import { verifyPassword } from "@/server/password";

const fx = Object.fromEntries(readFileSync(process.argv[2], "utf8").trim().split("\n").map((l) => [l.slice(0, l.indexOf(" ")), l.slice(l.indexOf(" ") + 1)]));
const email = `spike-${Date.now()}@kivubank.rw`;

// 1. Python argon2-cffi hash verifies in Node
assert.equal(await verifyPassword({ hash: fx.HASH, password: "Correct-Horse-Battery-9" }), true);
assert.equal(await verifyPassword({ hash: fx.HASH, password: "wrong" }), false);
console.log("1 argon2 parity ok");
// 2. Fernet TOTP secret decrypts
assert.equal(fernetDecrypt(fx.FCT, fx.FKEY), "JBSWY3DPEHPK3PXP");
console.log("2 fernet ok");
// 3. Sign-up writes users (ULID id) + auth_accounts (argon2 password)
const su = await auth.api.signUpEmail({ body: { name: "Spike User", email, password: "Correct-Horse-Battery-9" } });
const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email));
assert.match(u.id, /^[0-9A-HJKMNP-TV-Z]{26}$/);
const [acc] = await db.select().from(schema.authAccounts).where(eq(schema.authAccounts.userId, u.id));
assert.match(acc.password!, /^\$argon2id\$/);
console.log("3 sign-up ok", u.id, su.user.id === u.id);
// 4. Sign-in blocked until verified, then works
await assert.rejects(auth.api.signInEmail({ body: { email, password: "Correct-Horse-Battery-9" } }));
await db.update(schema.users).set({ isEmailVerified: true }).where(eq(schema.users.id, u.id));
const si = await auth.api.signInEmail({ body: { email, password: "Correct-Horse-Battery-9" }, asResponse: true });
const cookie = si.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
assert.ok(cookie.includes("ledgerline"));
const headers = new Headers({ cookie });
console.log("4 verify-gated sign-in ok");
// 5. Organization → tenants + tenant_memberships(workspace_role owner)
const org = await auth.api.createOrganization({ body: { name: "Spike Bank", slug: `spike-${Date.now()}` }, headers });
const [m] = await db.select().from(schema.tenantMemberships).where(eq(schema.tenantMemberships.tenantId, org!.id));
assert.equal(m.workspaceRole, "owner");
console.log("5 organization ok", org!.id);
// 6. Lockout: 5 bad passwords lock the account
for (let i = 0; i < 5; i++) await auth.api.signInEmail({ body: { email, password: "nope-nope-nope" } }).catch(() => {});
const [locked] = await db.select().from(schema.users).where(eq(schema.users.id, u.id));
assert.ok(locked.lockedUntil && locked.lockedUntil > new Date(), "should be locked");
await assert.rejects(auth.api.signInEmail({ body: { email, password: "Correct-Horse-Battery-9" } }));
console.log("6 lockout ok");
// 7. Engine JWT: signed with our claims, verifiable from the JWKS
const { token } = await auth.api.signJWT({ body: { payload: { sub: u.id, tid: org!.id, svc: { ecl: { role: "reviewer" } }, iat: Math.floor(Date.now() / 1000) } } });
const jwks = await auth.api.getJwks();
const { payload, protectedHeader } = await jwtVerify(token, createLocalJWKSet(jwks), { issuer: "ledgerline-web", audience: "ecl-engine" });
assert.equal(protectedHeader.alg, "RS256"); assert.equal(payload.tid, org!.id);
assert.ok(payload.exp! - payload.iat! <= 300);
console.log("7 engine jwt ok", protectedHeader.alg, payload.exp! - payload.iat!, "s");
// 8. Emails landed in the outbox
const out = await db.select().from(schema.emailOutbox).where(eq(schema.emailOutbox.taskName, "send_rendered_email"));
assert.ok(out.some((r) => (r.payload as { to: string }).to === email));
console.log("8 outbox ok", out.length);
void createRemoteJWKSet;
process.exit(0);
