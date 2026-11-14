"use server";
import { validImage } from "@/server/image";
import { and, eq } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { z } from "zod";
import { passwordOk } from "@/lib/password";
import { audit } from "@/server/audit";
import { auth } from "@/server/auth";
import { db, schema } from "@/server/db/client";
import type { ActionResult } from "@/server/mutate";
import { getPrincipal } from "@/server/session";

// Account actions call Better Auth (which owns password, 2FA and session rules) and add our audit trail.
async function me() {
  const p = await getPrincipal();
  if (!p) throw new APIError("UNAUTHORIZED", { message: "Your session ended. Sign in again." });
  return p;
}
const fail = (e: unknown, fallback: string): ActionResult<never> => ({ ok: false, error: e instanceof APIError && e.message ? e.message : fallback });

const PROFILE = z.object({ name: z.string().trim().min(2, "Enter your full name").max(80), title: z.string().trim().max(80), phone: z.string().trim().regex(/^(\+?[0-9 ()-]{7,20})?$/, "Use digits, spaces and an optional +"), locale: z.enum(["en", "fr"]), timeZone: z.string().max(64), numberFormat: z.string().max(16) });

export async function updateProfile(input: z.input<typeof PROFILE>): Promise<ActionResult> {
  const parsed = PROFILE.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    const p = await me();
    await auth.api.updateUser({ body: parsed.data, headers: await headers() });
    await audit({ event: "account.profile_updated", userId: p.userId, tenantId: p.tenantId, details: { fields: Object.keys(parsed.data) } });
    return { ok: true, data: undefined };
  } catch (e) { return fail(e, "Couldn't save your profile."); }
}

/** NA3 profile photo (null removes it). */
export async function setPhoto(dataUrl: string | null): Promise<ActionResult> {
  const image = dataUrl === null ? null : validImage(dataUrl);
  if (dataUrl !== null && !image) return { ok: false, error: "Use a PNG, JPEG or WebP image under 200 KB." };
  try {
    const p = await me();
    await db.update(schema.users).set({ avatarData: image, updatedAt: new Date() }).where(eq(schema.users.id, p.userId));
    // Short versioned URL in the session; the bytes are served by /api/avatar/[id].
    await auth.api.updateUser({ body: { image: image ? `/api/avatar/${p.userId}?v=${Date.now().toString(36)}` : null }, headers: await headers() });
    await audit({ event: image ? "account.photo_updated" : "account.photo_removed", userId: p.userId, tenantId: p.tenantId, details: {} });
    return { ok: true, data: undefined };
  } catch (e) { return fail(e, "Couldn't save your photo."); }
}

export async function requestEmailChange(newEmail: string): Promise<ActionResult> {
  const email = newEmail.trim().toLowerCase();
  if (!z.email().safeParse(email).success) return { ok: false, error: "Enter a valid email address." };
  try {
    const p = await me();
    if (p.tenantId) {
      const [t] = await db.select({ domains: schema.tenants.allowedDomains }).from(schema.tenants).where(eq(schema.tenants.id, p.tenantId));
      if (t.domains.length && !t.domains.includes(email.split("@")[1])) return { ok: false, error: `Your workspace allows ${t.domains.map((d) => `@${d}`).join(", ")} only.` };
    }
    await auth.api.changeEmail({ body: { newEmail: email, callbackURL: "/account/profile?email=changed" }, headers: await headers() });
    await audit({ event: "account.email_change_requested", userId: p.userId, tenantId: p.tenantId, details: { to: email } });
    return { ok: true, data: undefined };
  } catch (e) { return fail(e, "Couldn't start the email change."); }
}

export async function changePassword(current: string, next: string): Promise<ActionResult> {
  if (!passwordOk(next)) return { ok: false, error: "Use 12+ characters that aren't in known breaches." };
  try {
    const p = await me();
    await auth.api.changePassword({ body: { currentPassword: current, newPassword: next, revokeOtherSessions: true }, headers: await headers() });
    await audit({ event: "account.password_changed", userId: p.userId, tenantId: p.tenantId });
    return { ok: true, data: undefined };
  } catch (e) { return fail(e, "Your current password is incorrect."); }
}

/** NA4.2 step 1: confirm password → TOTP URI + backup codes (2FA becomes active only after verifyMfaSetup). */
export async function startMfaSetup(password: string): Promise<ActionResult<{ uri: string; secret: string; backupCodes: string[] }>> {
  try {
    await me();
    const r = await auth.api.enableTwoFactor({ body: { password }, headers: await headers() });
    if (r.method !== "totp") return { ok: false, error: "Authenticator setup isn't available." };
    return { ok: true, data: { uri: r.totpURI, secret: new URL(r.totpURI).searchParams.get("secret") ?? "", backupCodes: r.backupCodes } };
  } catch (e) { return fail(e, "Your password is incorrect."); }
}

export async function verifyMfaSetup(code: string): Promise<ActionResult> {
  try {
    const p = await me();
    await auth.api.verifyTOTP({ body: { code: code.replace(/\s/g, "") }, headers: await headers() });
    await audit({ event: "account.mfa_enabled", userId: p.userId, tenantId: p.tenantId });
    return { ok: true, data: undefined };
  } catch { return { ok: false, error: "That code didn't match. Wait for a new code and try again." }; }
}

export async function disableMfa(password: string): Promise<ActionResult> {
  try {
    const p = await me();
    await auth.api.disableTwoFactor({ body: { password }, headers: await headers() });
    await audit({ event: "account.mfa_disabled", userId: p.userId, tenantId: p.tenantId });
    return { ok: true, data: undefined };
  } catch (e) { return fail(e, "Your password is incorrect."); }
}

/** NA4 sessions: revoke one (by id; the token is looked up server-side) or all others. */
export async function revokeMySession(sessionId: string): Promise<ActionResult> {
  try {
    const p = await me();
    const [s] = await db.select({ token: schema.authSessions.token }).from(schema.authSessions).where(and(eq(schema.authSessions.id, sessionId), eq(schema.authSessions.userId, p.userId)));
    if (!s) return { ok: false, error: "That session already ended." };
    await auth.api.revokeSession({ body: { token: s.token }, headers: await headers() });
    await audit({ event: "account.session_revoked", userId: p.userId, tenantId: p.tenantId });
    return { ok: true, data: undefined };
  } catch (e) { return fail(e, "Couldn't sign that session out."); }
}

export async function revokeOtherSessions(): Promise<ActionResult> {
  try {
    const p = await me();
    await auth.api.revokeOtherSessions({ headers: await headers() });
    await audit({ event: "account.sessions_revoked", userId: p.userId, tenantId: p.tenantId });
    return { ok: true, data: undefined };
  } catch (e) { return fail(e, "Couldn't sign the other sessions out."); }
}
