"use server";
import { and, eq, isNull } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isEmail } from "@/lib/validation";
import { passwordOk } from "@/lib/password";
import { audit } from "@/server/audit";
import { auth } from "@/server/auth";
import { db, schema } from "@/server/db/client";
import { provisionWorkspace, type TrialService } from "@/server/dal/provision";
import { enqueueEmail } from "@/server/email/enqueue";
import { env } from "@/server/env";
import { notify, workspaceAdmins } from "@/server/notify";
import { ulid } from "@/server/ids";

export type FormState = { ok: false; error?: string; fields?: Record<string, string>; attemptsLeft?: number; lockedUntil?: number } | { ok: true; message?: string } | null;

const LOCK_AFTER = 5;
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/home");
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const code = (e: unknown) => (e instanceof APIError ? String((e.body as { code?: string } | undefined)?.code ?? e.status) : "");

/**
 * Where to land after sign-in. The new cookie isn't on this request yet, so read the session row by its token;
 * the session hook already picked the workspace when there is exactly one.
 */
async function landing(token: string | undefined, next: string) {
  const [s] = token ? await db.select({ org: schema.authSessions.activeOrganizationId, staff: schema.users.platformRole }).from(schema.authSessions).innerJoin(schema.users, eq(schema.users.id, schema.authSessions.userId)).where(eq(schema.authSessions.token, token)) : [];
  if (s?.org) return safeNext(next);
  if (s?.staff) return next.startsWith("/platform") ? safeNext(next) : "/platform"; // staff without a client workspace
  return `/select-workspace?next=${encodeURIComponent(safeNext(next))}`;
}

export async function signIn(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase(), password = String(f.get("password") ?? ""), next = str(f, "next");
  const fields: Record<string, string> = {};
  if (!isEmail(email)) fields.email = "Enter a valid email address.";
  if (!password) fields.password = "Enter your password.";
  if (Object.keys(fields).length) return { ok: false, fields };
  let twoFactor = false, token: string | undefined;
  try {
    const r = await auth.api.signInEmail({ body: { email, password, rememberMe: f.get("keep") === "on" }, headers: await headers() });
    twoFactor = Boolean((r as { twoFactorRedirect?: boolean }).twoFactorRedirect);
    token = (r as { token?: string }).token;
  } catch (e) {
    const c = code(e);
    if (c === "EMAIL_NOT_VERIFIED") redirect(`/verify-email-pending?email=${encodeURIComponent(email)}&unverified=1`);
    const [u] = await db.select({ failed: schema.users.failedLoginCount, lockedUntil: schema.users.lockedUntil }).from(schema.users).where(eq(schema.users.email, email));
    if (u?.lockedUntil && u.lockedUntil > new Date()) return { ok: false, lockedUntil: u.lockedUntil.getTime() };
    if (e instanceof APIError && e.status === "FORBIDDEN") return { ok: false, error: e.message };
    if (e instanceof APIError && e.status === "TOO_MANY_REQUESTS") return { ok: false, error: "Too many attempts from this network. Wait a minute and try again." };
    // Same message whether the email exists or not; the counter only shows for real accounts.
    return { ok: false, error: "Email or password is incorrect.", attemptsLeft: u ? Math.max(0, LOCK_AFTER - u.failed) : undefined, fields: { password: " " } };
  }
  if (twoFactor) redirect(`/sign-in/mfa?next=${encodeURIComponent(safeNext(next))}`);
  redirect(await landing(token, next));
}

export async function verifyMfa(_: FormState, f: FormData): Promise<FormState> {
  const c = str(f, "code").replace(/\s/g, ""), backup = f.get("mode") === "backup", h = await headers();
  if (!c) return { ok: false, error: "Enter the code." };
  let token: string | undefined;
  try {
    const r = backup ? await auth.api.verifyBackupCode({ body: { code: c, trustDevice: f.get("trust") === "on" }, headers: h })
      : await auth.api.verifyTOTP({ body: { code: c, trustDevice: f.get("trust") === "on" }, headers: h });
    token = (r as { token?: string }).token;
  } catch (e) {
    if (e instanceof APIError && e.status === "UNAUTHORIZED" && code(e).includes("TWO_FACTOR_COOKIE")) redirect("/auth/error?reason=session-expired");
    return { ok: false, error: backup ? "That backup code isn't valid or was already used." : "That code didn't work. Codes refresh every 30 seconds." };
  }
  redirect(await landing(token, str(f, "next")));
}

export async function signOut(reason?: unknown) {
  await auth.api.signOut({ headers: await headers() }).catch(() => {});
  redirect(reason === "idle" ? "/sign-in?expired=1" : "/sign-in?signed-out=1"); // form actions pass FormData here
}

export async function signUp(_: FormState, f: FormData): Promise<FormState> {
  const name = str(f, "name"), email = str(f, "email").toLowerCase(), password = String(f.get("password") ?? ""), company = str(f, "company");
  const service = str(f, "service") as TrialService;
  const fields: Record<string, string> = {};
  if (name.length < 2) fields.name = "Enter your full name.";
  if (!isEmail(email)) fields.email = "Enter a valid email address.";
  if (!passwordOk(password)) fields.password = "Use 12+ characters that aren't in known breaches.";
  if (company.length < 2) fields.company = "Enter your company name.";
  if (!str(f, "country")) fields.country = "Choose your country.";
  if (!["ecl", "leases"].includes(service)) fields.service = "Pick a service to try.";
  if (f.get("terms") !== "on") fields.terms = "You must agree to the Terms and Privacy Policy.";
  if (Object.keys(fields).length) return { ok: false, fields };
  const pending = `/verify-email-pending?email=${encodeURIComponent(email)}`;
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.email, email), isNull(schema.users.deletedAt)));
  if (existing) {
    // No account enumeration: same next screen; the owner of the address gets told instead.
    await enqueueEmail(email, "Someone tried to sign up with your email", { preview: "Sign up attempt", headline: "You already have an account", paragraphs: ["Someone tried to create a Komputy account with this email. If it was you, sign in instead.", "If it wasn't, you can ignore this email."], cta: { label: "Sign in", href: new URL("/sign-in", env.BETTER_AUTH_URL).toString() } });
    redirect(pending);
  }
  try {
    const r = await auth.api.signUpEmail({ body: { name, email, password, callbackURL: "/verify-email?verified=1" } });
    await db.transaction(async (tx) => {
      const ws = await provisionWorkspace(tx, { userId: r.user.id, name: company, country: str(f, "country"), currency: str(f, "currency") || "USD", fiscalYearEnd: str(f, "fye") || "12-31", services: [service], emailDomain: email.split("@")[1] });
      await audit({ event: "workspace.created", userId: r.user.id, tenantId: ws.tenantId, details: { via: "sign-up", service, size: str(f, "size") } }, tx);
    });
  } catch (e) {
    if (code(e).includes("PASSWORD_COMPROMISED") || (e instanceof APIError && /breach/i.test(e.message))) return { ok: false, fields: { password: "This password appeared in a data breach. Choose a different one." } };
    if (e instanceof APIError && e.status === "TOO_MANY_REQUESTS") return { ok: false, error: "Too many sign ups from this network. Try again later." };
    throw e;
  }
  redirect(pending);
}

export async function resendVerification(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase();
  if (!isEmail(email)) return { ok: false, error: "Enter a valid email address." };
  await auth.api.sendVerificationEmail({ body: { email, callbackURL: "/verify-email?verified=1" } }).catch(() => {}); // silent: no enumeration
  return { ok: true, message: "Sent again." };
}

export async function requestReset(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase();
  if (!isEmail(email)) return { ok: false, fields: { email: "Enter a valid email address." } };
  await auth.api.requestPasswordReset({ body: { email, redirectTo: "/reset-password" } }).catch(() => {});
  return { ok: true, message: email }; // same answer whether or not the account exists
}

export async function resetPassword(_: FormState, f: FormData): Promise<FormState> {
  const pw = String(f.get("password") ?? ""), confirm = String(f.get("confirm") ?? ""), token = str(f, "token");
  if (!token) return { ok: false, error: "This reset link is invalid or has expired." };
  const fields: Record<string, string> = {};
  if (!passwordOk(pw)) fields.password = "Use 12+ characters that aren't in known breaches.";
  if (pw !== confirm) fields.confirm = "Passwords don't match.";
  if (Object.keys(fields).length) return { ok: false, fields };
  try {
    await auth.api.resetPassword({ body: { newPassword: pw, token } });
  } catch (e) {
    if (e instanceof APIError && /breach/i.test(e.message)) return { ok: false, fields: { password: "This password appeared in a data breach. Choose a different one." } };
    return { ok: false, error: "This reset link is invalid or has expired." };
  }
  return { ok: true };
}

export async function acceptInvite(_: FormState, f: FormData): Promise<FormState> {
  const invitationId = str(f, "invitation"), h = await headers();
  const [inv] = await db.select().from(schema.invitations).where(eq(schema.invitations.id, invitationId));
  if (!inv || inv.status !== "pending" || inv.expiresAt < new Date()) return { ok: false, error: "This invite has expired or was already used. Ask your administrator for a new one." };
  if (f.get("mode") === "new") {
    const name = str(f, "name"), password = String(f.get("password") ?? "");
    const fields: Record<string, string> = {};
    if (name.length < 2) fields.name = "Enter your full name.";
    if (!passwordOk(password)) fields.password = "Use 12+ characters that aren't in known breaches.";
    if (f.get("terms") !== "on") fields.terms = "You must agree to the Terms and Privacy Policy.";
    if (Object.keys(fields).length) return { ok: false, fields };
    try {
      const r = await auth.api.signUpEmail({ body: { name, email: inv.email, password } });
      // The invite link reached this inbox, which proves the address: no second verification email.
      await db.update(schema.users).set({ isEmailVerified: true }).where(eq(schema.users.id, r.user.id));
      await auth.api.signInEmail({ body: { email: inv.email, password }, headers: h });
    } catch (e) {
      if (e instanceof APIError && /breach/i.test(e.message)) return { ok: false, fields: { password: "This password appeared in a data breach. Choose a different one." } };
      return { ok: false, error: "An account with this email already exists. Sign in to accept the invite." };
    }
  }
  const s = await auth.api.getSession({ headers: h });
  if (!s) redirect(`/sign-in?next=${encodeURIComponent(`/invite/${invitationId}`)}`);
  if (s.user.email.toLowerCase() !== inv.email.toLowerCase()) return { ok: false, error: `This invite is for ${inv.email}. Sign out and sign in with that address.` };
  try {
    await auth.api.acceptInvitation({ body: { invitationId }, headers: h });
    await applyInvitedRoles(inv.id, s.user.id);
    await auth.api.setActiveOrganization({ body: { organizationId: inv.tenantId }, headers: h });
  } catch {
    return { ok: false, error: "We couldn't accept this invite. It may have been revoked." };
  }
  redirect("/home");
}

/** Copies the per-service roles chosen in the invite (CA3) onto the new membership. */
async function applyInvitedRoles(invitationId: string, userId: string) {
  const [inv] = await db.select().from(schema.invitations).where(eq(schema.invitations.id, invitationId));
  const [m] = await db.select().from(schema.tenantMemberships).where(and(eq(schema.tenantMemberships.tenantId, inv.tenantId), eq(schema.tenantMemberships.userId, userId)));
  if (!inv || !m) return;
  const roles = (inv.serviceRoles ?? {}) as Record<string, string>;
  await db.transaction(async (tx) => {
    for (const [service, role] of Object.entries(roles)) if (role && role !== "none") await tx.insert(schema.memberServiceRoles).values({ id: ulid(), membershipId: m.id, service, role }).onConflictDoNothing();
    await audit({ event: "member.joined", userId, tenantId: inv.tenantId, details: { invitationId, roles } }, tx);
    const [u] = await tx.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, userId));
    await notify((await workspaceAdmins(inv.tenantId, tx)).filter((id) => id !== userId), { event: "joined", kind: "workspace", tenantId: inv.tenantId, title: `${u?.name ?? inv.email} joined the workspace`, body: Object.entries(roles).filter(([, r]) => r && r !== "none").map(([s, r]) => `${s === "ecl" ? "ECL" : "Leases"} ${r}`).join(" · ") || "No service roles yet", href: "/admin/members",
      email: { subject: `${u?.name ?? inv.email} joined your workspace`, message: { preview: "New member", headline: `${u?.name ?? inv.email} joined`, paragraphs: [`${u?.name ?? inv.email} accepted their invite.`], cta: { label: "View members", href: new URL("/admin/members", env.BETTER_AUTH_URL).toString() } } } }, tx);
  });
}

export async function chooseWorkspace(f: FormData) {
  const id = str(f, "workspace");
  try {
    await auth.api.setActiveOrganization({ body: { organizationId: id }, headers: await headers() });
  } catch {
    redirect("/select-workspace?error=not-a-member");
  }
  redirect(safeNext(str(f, "next")));
}
