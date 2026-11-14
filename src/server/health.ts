import "server-only";
import { sql } from "drizzle-orm";
import Redis from "ioredis";
import { db } from "@/server/db/client";
import { env } from "@/server/env";

export interface Probe { name: string; ok: boolean; value: string; ms: number | null }

const timed = async (fn: () => Promise<string>): Promise<[boolean, string, number | null]> => {
  const t = performance.now();
  try { return [true, await fn(), Math.round(performance.now() - t)]; } catch (e) { return [false, e instanceof Error && e.name === "TimeoutError" ? "No response in 3 s" : e instanceof Error ? e.message.slice(0, 60) : "Down", null]; }
};

/** PA8.2: live probes from this server: database, Redis, engine API (+ its own checks: workers, email outbox). */
export async function probes(): Promise<Probe[]> {
  const [dbp, redis, engine] = await Promise.all([
    timed(async () => { await db.execute(sql`select 1`); return "Normal"; }),
    timed(async () => { if (!env.REDIS_URL) return "Not configured"; const r = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 2000 }); try { await r.connect(); await r.ping(); return "Normal"; } finally { r.disconnect(); } }),
    timed(async () => { const r = await fetch(new URL("/health", env.ENGINE_URL), { signal: AbortSignal.timeout(3000), cache: "no-store" }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return JSON.stringify(await r.json()); }),
  ]);
  const h = engine[0] ? (JSON.parse(engine[1]) as Record<string, string | number>) : {};
  return [
    { name: "Web database", ok: dbp[0], value: dbp[1], ms: dbp[2] },
    { name: "Redis", ok: redis[0], value: redis[1], ms: redis[2] },
    { name: "Engine API", ok: engine[0], value: engine[0] ? "Normal" : engine[1], ms: engine[2] },
    { name: "Workers", ok: engine[0] && h.celery_worker !== "no_workers", value: engine[0] ? String(h.celery_worker ?? "—").replace("no_workers", "No workers running") : "Unknown", ms: null },
    { name: "Storage", ok: h.storage === "ok", value: engine[0] ? String(h.storage ?? "—") : "Unknown", ms: null },
    { name: "Email outbox", ok: Number(h.email_outbox_dead_letters ?? 0) === 0, value: engine[0] ? `${h.email_outbox_pending ?? 0} pending · ${h.email_outbox_dead_letters ?? 0} dead-letter` : "Unknown", ms: null },
  ];
}
