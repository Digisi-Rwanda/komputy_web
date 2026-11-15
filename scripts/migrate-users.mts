// Phase 2.5: move existing the previous engine accounts onto Better Auth (plan §3.3). Idempotent; `--dry-run` writes nothing.
// Run: TOTP_ENCRYPTION_KEY=<the previous engine Fernet key> npx tsx --conditions=react-server --env-file=.env.local scripts/migrate-users.mts [--dry-run]
import { symmetricEncrypt } from "better-auth/crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { env } from "@/server/env";
import { fernetDecrypt } from "@/server/fernet";
import { ulid } from "@/server/ids";

const dry = process.argv.includes("--dry-run");
const fernetKey = process.env.TOTP_ENCRYPTION_KEY;
const out = { users: 0, passwords: 0, alreadyMigrated: 0, totp: 0, totpFailed: 0, noPassword: 0 };

const users = await db.select().from(schema.users).where(isNull(schema.users.deletedAt));
out.users = users.length;
for (const u of users) {
  await db.transaction(async (tx) => {
    const [acc] = await tx.select({ id: schema.authAccounts.id }).from(schema.authAccounts).where(and(eq(schema.authAccounts.userId, u.id), eq(schema.authAccounts.providerId, "credential")));
    if (acc) { out.alreadyMigrated++; return; }
    if (!u.hashedPassword?.startsWith("$argon2")) { out.noPassword++; return; } // never had a password here: they'll use "Forgot password"
    if (!dry) await tx.insert(schema.authAccounts).values({ id: ulid(), userId: u.id, accountId: u.id, providerId: "credential", password: u.hashedPassword });
    out.passwords++;
    if (u.totpEnabled && u.totpSecretEncrypted) {
      if (!fernetKey) throw new Error("TOTP_ENCRYPTION_KEY is required to migrate authenticator secrets");
      try {
        const secret = fernetDecrypt(u.totpSecretEncrypted, fernetKey);
        if (!dry) {
          await tx.insert(schema.authTwoFactor).values({ id: ulid(), userId: u.id, secret: await symmetricEncrypt({ key: env.BETTER_AUTH_SECRET, data: secret }), backupCodes: await symmetricEncrypt({ key: env.BETTER_AUTH_SECRET, data: "[]" }), verified: true }).onConflictDoNothing();
          // Old backup codes were one-way hashed: ask for new ones (banner via notification in every workspace).
          const ms = await tx.select({ tenantId: schema.tenantMemberships.tenantId }).from(schema.tenantMemberships).where(eq(schema.tenantMemberships.userId, u.id));
          if (ms.length) await tx.insert(schema.userNotifications).values(ms.map((m) => ({ id: ulid(), userId: u.id, tenantId: m.tenantId, kind: "security", isRead: false, title: "Generate new backup codes", body: "We upgraded sign-in. Your authenticator still works; create new backup codes in Account → Security.", href: "/account/security" })));
        }
        out.totp++;
      } catch (e) {
        out.totpFailed++;
        console.error(`TOTP not migrated for ${u.email}: ${(e as Error).message} (they keep password sign-in; MFA must be set up again)`);
        if (!dry) await tx.update(schema.users).set({ totpEnabled: false }).where(eq(schema.users.id, u.id));
      }
    }
  });
}
// Checksum: every user with an argon2 hash now has exactly one credential account.
const [check] = await db.select({ missing: sql<number>`count(*)::int` }).from(schema.users)
  .where(and(isNull(schema.users.deletedAt), sql`${schema.users.hashedPassword} like '$argon2%'`, sql`not exists (select 1 from auth_accounts a where a.user_id = ${schema.users.id} and a.provider_id = 'credential')`));
console.log(JSON.stringify({ dryRun: dry, ...out, missingAfter: dry ? "n/a (dry run)" : check.missing }, null, 2));
process.exit(!dry && check.missing > 0 ? 1 : 0);
