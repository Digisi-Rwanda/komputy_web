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

/** PA8.2: live probes from this server: database, Redis, engine API (/readyz: its database, storage, live workers), email outbox. */
export async function probes(): Promise<Probe[]> {
  const [dbp, redis, engine, mail] = await Promise.all([
    timed(async () => { await db.execute(sql`select 1`); return "Normal"; }),
    timed(async () => { if (!env.REDIS_URL) return "Not configured"; const r = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 2000 }); try { await r.connect(); await r.ping(); return "Normal"; } finally { r.disconnect(); } }),
    // 503 = degraded but answering: keep the body so the storage/database checks still show.
    timed(async () => { const r = await fetch(new URL("/readyz", env.ENGINE_URL), { signal: AbortSignal.timeout(3000), cache: "no-store" }); if (!r.ok && r.status !== 503) throw new Error(`HTTP ${r.status}`); return JSON.stringify(await r.json()); }),
    timed(async () => {
      const [r] = (await db.execute<{ pending: number; dead: number }>(sql`select count(*) filter (where status in ('pending','retry') and dispatch_attempts < 5)::int as pending, count(*) filter (where status = 'retry' and dispatch_attempts >= 5)::int as dead from email_outbox`)) as unknown as { pending: number; dead: number }[];
      return JSON.stringify(r);
    }),
  ]);
  const h = engine[0] ? (JSON.parse(engine[1]) as { checks?: Record<string, string>; workers?: number }) : {};
  const m = mail[0] ? (JSON.parse(mail[1]) as { pending: number; dead: number }) : null;
  const storage = h.checks?.storage;
  return [
    { name: "Web database", ok: dbp[0], value: dbp[1], ms: dbp[2] },
    { name: "Redis", ok: redis[0], value: redis[1], ms: redis[2] },
    { name: "Engine API", ok: engine[0] && h.checks?.db === "ok", value: engine[0] ? (h.checks?.db === "ok" ? "Normal" : "Engine database unreachable") : engine[1], ms: engine[2] },
    { name: "Workers", ok: (h.workers ?? 0) > 0, value: engine[0] ? ((h.workers ?? 0) > 0 ? `${h.workers} running` : "No workers running") : "Unknown", ms: null },
    { name: "Storage", ok: storage === "ok", value: storage === "ok" ? "Normal" : storage ?? "Unknown", ms: null },
    { name: "Email outbox", ok: Boolean(m) && m!.dead === 0, value: m ? `${m.pending} pending · ${m.dead} failed` : mail[1], ms: null },
  ];
}
