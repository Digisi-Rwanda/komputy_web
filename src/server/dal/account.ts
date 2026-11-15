import "server-only";
import { and, desc, eq, gt } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { ago } from "@/server/dal/members";

const device = (ua: string | null) => {
  const u = ua ?? "";
  const browser = /Edg\//.test(u) ? "Edge" : /Chrome\//.test(u) ? "Chrome" : /Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(u) ? "iPhone" : /Android/.test(u) ? "Android" : /Mac OS X/.test(u) ? "macOS" : /Windows/.test(u) ? "Windows" : /Linux/.test(u) ? "Linux" : "device";
  return { name: `${browser} on ${os}`, mobile: /iPhone|Android/.test(u) };
};

/** NA4: the caller's live sessions (no tokens leave the server). */
export async function listMySessions(userId: string, currentSessionId: string) {
  const rows = await db.select().from(schema.authSessions).where(and(eq(schema.authSessions.userId, userId), gt(schema.authSessions.expiresAt, new Date()))).orderBy(desc(schema.authSessions.updatedAt));
  return rows.map((s) => ({ id: s.id, ...device(s.userAgent), current: s.id === currentSessionId, lastSeen: s.id === currentSessionId ? "This device" : ago(s.updatedAt) }));
}

/** NA3/NA4 profile facts for the forms. */
export async function getAccount(userId: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  const [pw] = await db.select({ updatedAt: schema.authAccounts.updatedAt }).from(schema.authAccounts).where(and(eq(schema.authAccounts.userId, userId), eq(schema.authAccounts.providerId, "credential")));
  return {
    name: u.name, title: u.title ?? "", email: u.email, emailVerified: u.isEmailVerified, phone: u.phone ?? "", locale: u.locale, timeZone: u.timeZone, numberFormat: u.numberFormat,
    photo: u.image ?? null, mfa: u.totpEnabled, passwordChanged: pw ? ago(pw.updatedAt) : "Never",
  };
}
