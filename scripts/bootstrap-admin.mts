// First platform admin for a fresh production database. Idempotent: does nothing once the email exists.
// Runs in the Render pre-deploy step after migrations when BOOTSTRAP_ADMIN_EMAIL is set. Without
// BOOTSTRAP_ADMIN_PASSWORD the password is random and never shown: the admin sets one via "Forgot password".
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { ulid } from "@/server/ids";
import { hashPassword } from "@/server/password";

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || randomBytes(32).toString("base64url");
if (!email) {
  console.log("bootstrap-admin: BOOTSTRAP_ADMIN_EMAIL not set, skipping");
  process.exit(0);
}
if (password.length < 12) throw new Error("bootstrap-admin: password must be at least 12 characters");

const [found] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
if (found) {
  console.log(`bootstrap-admin: ${email} exists, nothing to do`);
  process.exit(0);
}
const id = ulid(), hash = await hashPassword(password);
await db.transaction(async (tx) => {
  await tx.insert(schema.users).values({ id, name: process.env.BOOTSTRAP_ADMIN_NAME ?? "Platform admin", email, isEmailVerified: true, platformRole: "admin", isPlatformAdmin: true, totpEnabled: false });
  await tx.insert(schema.authAccounts).values({ id: ulid(), userId: id, accountId: id, providerId: "credential", password: hash });
});
console.log(`bootstrap-admin: created platform admin ${email}`);
process.exit(0);
