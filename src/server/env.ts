import "server-only";
import { z } from "zod";

// Validated once at boot; a missing or malformed variable fails fast instead of at the first request.
const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  REDIS_URL: z.url().optional(),
  ENGINE_URL: z.url().default("http://localhost:8000"),
  IP_HASH_SALT: z.string().min(16),
  CRON_SECRET: z.string().min(16),
  EMAIL_FROM: z.string().default("Ledgerline <no-reply@ledgerline.app>"),
  // Email delivery (the web app dispatches the outbox itself). Unset in dev: emails stay queued and are logged.
  RESEND_API_KEY: z.string().optional(),
  // Shared secret for ops calls to the engine (tenant purge). Must match the engine's SERVICE_TOKEN.
  ENGINE_SERVICE_TOKEN: z.string().min(16).default("dev-service-token-change-me"),
  // Same argon2id parameters as ECL-Server so existing password hashes verify unchanged.
  ARGON2_MEMORY_COST: z.coerce.number().default(65536),
  ARGON2_TIME_COST: z.coerce.number().default(3),
  ARGON2_PARALLELISM: z.coerce.number().default(4),
  DB_POOL_MAX: z.coerce.number().default(10),
});

export const env = schema.parse(process.env);
