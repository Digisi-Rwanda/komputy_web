import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import {
  haveIBeenPwned,
  jwt,
  organization,
  twoFactor,
} from "better-auth/plugins";
import { and, eq, isNull, sql } from "drizzle-orm";
import Redis from "ioredis";
import { db, schema } from "@/server/db/client";
import { enqueueEmail } from "@/server/email/enqueue";
import { env } from "@/server/env";
import { ulid } from "@/server/ids";
import { hashPassword, verifyPassword } from "@/server/password";

const url = (path: string) => new URL(path, env.BETTER_AUTH_URL).toString();
const LOCK_AFTER = 5,
  LOCK_MINUTES = 15;

// Shared across instances: rate limits + session cache. Without Redis (local/tests) Better Auth falls back to memory.
export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2 })
  : null;

export const auth = betterAuth({
  appName: "Komputy",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.authSessions,
      account: schema.authAccounts,
      verification: schema.authVerifications,
      organization: schema.tenants,
      member: schema.tenantMemberships,
      invitation: schema.invitations,
      twoFactor: schema.authTwoFactor,
      jwks: schema.authJwks,
    },
  }),
  secondaryStorage: redis
    ? {
        get: (k) => redis.get(k),
        getAndDelete: (k) => redis.getdel(k),
        // Atomic counter for rate limits; TTL only set on first hit so the window doesn't slide.
        increment: async (k, ttl) => {
          const n = await redis.incr(k);
          if (n === 1) await redis.expire(k, ttl);
          return n;
        },
        set: async (k, v, ttl) => {
          if (ttl) await redis.set(k, v, "EX", ttl);
          else await redis.set(k, v);
        },
        delete: async (k) => {
          await redis.del(k);
        },
      }
    : undefined,
  advanced: {
    database: { generateId: () => ulid() },
    cookiePrefix: "komputy",
    useSecureCookies: env.BETTER_AUTH_URL.startsWith("https://"),
    // Per-client rate limits: Render's edge (Cloudflare) sends the client IP as a single value in these headers;
    // a multi-hop X-Forwarded-For alone is not trusted, which would put every user in one shared bucket.
    ipAddress: { ipAddressHeaders: ["true-client-ip", "cf-connecting-ip", "x-forwarded-for"] },
  },
  // Existing the previous engine tables keep their column names; Better Auth's names are mapped onto them.
  user: {
    fields: { emailVerified: "isEmailVerified" }, // `image` = short /api/avatar URL (the photo itself is users.avatar_data, never in the session cookie)
    // NA3 "Change email": confirm from the current inbox, then verify the new one.
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url: link }) =>
        enqueueEmail(user.email, "Confirm your new email address", {
          preview: "Confirm the change of email", headline: "Confirm your new email",
          paragraphs: [`Someone asked to change the email on your Komputy account to ${newEmail}.`, "If it was you, confirm below. If not, ignore this email and your address stays the same."],
          cta: { label: "Confirm change", href: link },
        }),
    },
    additionalFields: {
      title: { type: "string", required: false },
      platformRole: { type: "string", required: false, input: false },
      phone: { type: "string", required: false },
      locale: { type: "string", required: false, defaultValue: "en" },
      timeZone: {
        type: "string",
        required: false,
        defaultValue: "Africa/Kigali",
      },
      numberFormat: {
        type: "string",
        required: false,
        defaultValue: "1,234.56",
      },
      isActive: {
        type: "boolean",
        required: false,
        input: false,
        defaultValue: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
    // Redis is the fast path; the DB row is the record (session list NA4, revoke-all, audits).
    storeSessionInDatabase: true,
    additionalFields: {
      device: { type: "string", required: false, input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12, // matches lib/password.ts (form) so client and server agree
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    password: { hash: hashPassword, verify: verifyPassword },
    sendResetPassword: async ({ user, url: link }) =>
      enqueueEmail(user.email, "Reset your Komputy password", {
        preview: "Reset your password",
        headline: "Reset your password",
        paragraphs: [
          "Someone asked to reset the password for this account. The link works for one hour.",
          "If it wasn't you, ignore this email. Your password stays the same.",
        ],
        cta: { label: "Choose a new password", href: link },
      }),
    onPasswordReset: async ({ user }) =>
      enqueueEmail(user.email, "Your Komputy password was changed", {
        preview: "Your password was changed",
        headline: "Your password was changed",
        paragraphs: [
          "Your password was just changed and other sessions were signed out.",
          "If this wasn't you, reset your password now and contact your administrator.",
        ],
        cta: { label: "Reset password", href: url("/forgot-password") },
      }),
  },
  emailVerification: {
    // NA6.1 welcome, once the address is proven (invitees skip this: their invite link proves it).
    afterEmailVerification: async (user) =>
      enqueueEmail(user.email, "Welcome to Komputy", {
        preview: "Your account is ready",
        headline: `Welcome, ${user.name.split(" ")[0]}`,
        paragraphs: [
          "Your Komputy account is ready. Create a workspace for your company, or open the invite your administrator sent you.",
          "Tip: turn on two-factor authentication in Account › Security. It takes a minute.",
        ],
        cta: { label: "Open Komputy", href: url("/select-workspace") },
      }),
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url: link }) =>
      enqueueEmail(user.email, "Verify your email for Komputy", {
        preview: "Confirm your email address",
        headline: "Confirm your email",
        paragraphs: [`Hi ${user.name.split(" ")[0]}, confirm this address to finish setting up your account. The link works for 24 hours.`],
        // Better Auth verifies, signs the person in, then redirects to the callbackURL set at sign-up (/verify-email?verified=1).
        cta: { label: "Verify email", href: link },
      }),
  },
  databaseHooks: {
    session: {
      create: {
        // New-device alert (security: always on). Skipped for the very first sign-in.
        after: async (session) => {
          const ua = (session as { userAgent?: string | null }).userAgent ?? "";
          const prev = await db.select({ ua: schema.authSessions.userAgent }).from(schema.authSessions)
            .where(and(eq(schema.authSessions.userId, session.userId), sql`${schema.authSessions.id} <> ${session.id}`)).limit(50);
          if (!prev.length || prev.some((p) => p.ua === ua)) return;
          const [u] = await db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, session.userId));
          if (u) await enqueueEmail(u.email, "New sign-in to your Komputy account", {
            preview: "New device sign-in", headline: "New sign-in from a new device",
            paragraphs: ["Your account was just used to sign in from a device we haven't seen before.", "If this was you, there's nothing to do. If not, change your password and sign out other sessions now."],
            details: [["Device", ua.slice(0, 120) || "Unknown"], ["IP", (session as { ipAddress?: string | null }).ipAddress || "Unknown"], ["Time", new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC"]],
            cta: { label: "Review sessions", href: url("/account/security") },
          });
        },
        // Open the workspace directly when the person belongs to exactly one; otherwise /select-workspace asks.
        before: async (session) => {
          const rows = await db.select({ tenantId: schema.tenantMemberships.tenantId }).from(schema.tenantMemberships)
            .innerJoin(schema.tenants, and(eq(schema.tenants.id, schema.tenantMemberships.tenantId), isNull(schema.tenants.deletedAt)))
            .where(and(eq(schema.tenantMemberships.userId, session.userId), eq(schema.tenantMemberships.status, "active"))).limit(2);
          return { data: { ...session, activeOrganizationId: rows.length === 1 ? rows[0].tenantId : null } };
        },
      },
    },
  },
  rateLimit: {
    enabled: true,
    storage: redis ? "secondary-storage" : "memory",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 60, max: 10 },
      "/request-password-reset": { window: 60 * 60, max: 3 },
      "/two-factor/verify-totp": { window: 5 * 60, max: 5 },
      "/two-factor/verify-backup-code": { window: 5 * 60, max: 5 },
      "/send-verification-email": { window: 60 * 60, max: 3 },
    },
  },
  hooks: {
    // Account lockout (same rule as the previous engine: 5 failures → 15 minutes). Lookup is by email; response stays generic.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = String(ctx.body?.email ?? "").toLowerCase();
      const [u] = await db
        .select({
          lockedUntil: schema.users.lockedUntil,
          isActive: schema.users.isActive,
          deletedAt: schema.users.deletedAt,
        })
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);
      if (u && (!u.isActive || u.deletedAt))
        throw new APIError("FORBIDDEN", {
          message: "This account is disabled. Contact your administrator.",
        });
      if (u?.lockedUntil && u.lockedUntil > new Date())
        throw new APIError("TOO_MANY_REQUESTS", {
          message: "Too many attempts. Try again later or reset your password.",
        });
    }),
    after: createAuthMiddleware(async (ctx) => {
      // Security emails for in-account changes (reset has its own in onPasswordReset). Always on.
      const SEC: Record<string, [string, string]> = {
        "/change-password": ["Your Komputy password was changed", "Your password was just changed from your account settings."],
        "/two-factor/enable": ["Two-factor authentication turned on", "Two-factor authentication is now protecting your account."],
        "/two-factor/disable": ["Two-factor authentication turned off", "Two-factor authentication was turned off for your account."],
        "/two-factor/generate-backup-codes": ["New backup codes created", "New backup codes were created; the old ones no longer work."],
      };
      const sec = SEC[ctx.path];
      if (sec && !(ctx.context.returned instanceof APIError)) {
        const email = ctx.context.session?.user.email ?? ctx.context.newSession?.user.email;
        if (email) await enqueueEmail(email, sec[0], {
          preview: sec[0], headline: sec[0],
          paragraphs: [sec[1], "If this wasn't you, reset your password now and contact your administrator."],
          cta: { label: "Review security", href: url("/account/security") },
        });
        return;
      }
      if (ctx.path !== "/sign-in/email") return;
      const email = String(ctx.body?.email ?? "").toLowerCase();
      const failed = ctx.context.returned instanceof APIError;
      await db
        .update(schema.users)
        .set(
          failed
            ? {
                failedLoginCount: sql`${schema.users.failedLoginCount} + 1`,
                lockedUntil: sql`CASE WHEN ${schema.users.failedLoginCount} + 1 >= ${LOCK_AFTER} THEN now() + interval '${sql.raw(String(LOCK_MINUTES))} minutes' ELSE ${schema.users.lockedUntil} END`,
              }
            : {
                failedLoginCount: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
              },
        )
        .where(eq(schema.users.email, email));
    }),
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      invitationExpiresIn: 60 * 60 * 24 * 7,
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: true,
      schema: {
        organization: {
          additionalFields: {
            legalName: { type: "string", required: false },
            country: { type: "string", required: false },
            currency: { type: "string", required: false, defaultValue: "USD" },
            plan: { type: "string", required: false, input: false },
            status: {
              type: "string",
              required: false,
              input: false,
              defaultValue: "trial",
            },
          },
        },
        member: {
          fields: { organizationId: "tenantId", role: "workspaceRole" },
        },
        invitation: {
          fields: {
            organizationId: "tenantId",
            role: "workspaceRole",
            inviterId: "invitedByUserId",
          },
        },
        session: { fields: { activeOrganizationId: "activeOrganizationId" } },
      },
      sendInvitationEmail: async ({ email, organization: org, inviter, id }) =>
        enqueueEmail(
          email,
          `${inviter.user.name} invited you to ${org.name} on Komputy`,
          {
            preview: `Join ${org.name} on Komputy`,
            headline: `Join ${org.name}`,
            paragraphs: [
              `${inviter.user.name} invited you to ${org.name} on Komputy. The invite expires in 7 days.`,
              "If you already have a Komputy account, you'll join with your existing login.",
            ],
            cta: { label: "Accept invite", href: url(`/invite/${id}`) },
          },
        ),
    }),
    twoFactor({
      issuer: "Komputy",
      backupCodeOptions: { storeBackupCodes: "encrypted" }, // never store usable codes in plain text
      schema: { user: { fields: { twoFactorEnabled: "totpEnabled" } } },
    }),
    haveIBeenPwned({
      customPasswordCompromisedMessage:
        "This password appeared in a data breach. Choose a different one.",
    }),
    // Keys + JWKS for the engine (Python) only; tokens are minted per request by server/engine.ts.
    jwt({
      jwks: { keyPairConfig: { alg: "RS256", modulusLength: 2048 } },
      jwt: {
        issuer: "komputy-web",
        audience: "komputy-engine",
        expirationTime: "5m",
      },
    }),
    nextCookies(), // must stay last: lets Server Actions set auth cookies
  ],
});

export type Session = typeof auth.$Infer.Session;
