import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { verifyPassword } from "@/server/password";

/** Step-up check for dangerous actions (plan §2.2 rule 7): the caller re-enters their password. */
export async function passwordMatches(userId: string, password: string): Promise<boolean> {
  if (!password) return false;
  const [a] = await db.select({ hash: schema.authAccounts.password }).from(schema.authAccounts).where(and(eq(schema.authAccounts.userId, userId), eq(schema.authAccounts.providerId, "credential")));
  return Boolean(a?.hash) && verifyPassword({ hash: a.hash!, password });
}
