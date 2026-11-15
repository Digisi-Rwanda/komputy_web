import "server-only";
import { z } from "zod";

// Validated once at boot; a missing or malformed variable fails fast instead of at the first request.
const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  // Render sets RENDER_EXTERNAL_URL (the onrender.com address) until the custom domain is configured explicitly.
  BETTER_AUTH_URL: z.url().default(process.env.RENDER_EXTERNAL_URL ?? ""),
  REDIS_URL: z.url().optional(),
  // Render private network: ENGINE_HOSTPORT (fromService hostport) when ENGINE_URL isn't set.
  ENGINE_URL: z.url().default(process.env.ENGINE_HOSTPORT ? `http://${process.env.ENGINE_HOSTPORT}` : "http://localhost:8000"),
  IP_HASH_SALT: z.string().min(16),
  CRON_SECRET: z.string().min(16),
  EMAIL_FROM: z.string().default("Ledgerline <no-reply@komputy.com>"),
  // Email delivery (the web app dispatches the outbox itself). Unset in dev: emails stay queued and are logged.
  RESEND_API_KEY: z.string().optional(),
  // Shared secret for ops calls to the engine (tenant purge). Must match the engine's SERVICE_TOKEN.
  ENGINE_SERVICE_TOKEN: z.string().min(16).default(process.env.SERVICE_TOKEN ?? "dev-service-token-change-me"),
  // Same argon2id parameters as ECL-Server so existing password hashes verify unchanged.
  ARGON2_MEMORY_COST: z.coerce.number().default(65536),
  ARGON2_TIME_COST: z.coerce.number().default(3),
  ARGON2_PARALLELISM: z.coerce.number().default(4),
  DB_POOL_MAX: z.coerce.number().default(10),
});

export const env = schema.parse(process.env);
