import "server-only";
import { headers } from "next/headers";
import { redis } from "@/server/auth";

const mem = new Map<string, { n: number; until: number }>();

/** Fixed-window limit per caller IP (Redis when configured, memory otherwise). True = allowed. */
export async function allow(bucket: string, max: number, windowSec: number) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  const key = `rl:${bucket}:${ip}`;
  if (redis) {
    const n = await redis.incr(key).catch(() => 0);
    if (n === 1) await redis.expire(key, windowSec).catch(() => {});
    return n <= max;
  }
  // shortcut: per-instance memory without Redis; fine for local/dev, Redis is required in production (env.ts).
  const now = Date.now(), cur = mem.get(key);
  if (!cur || cur.until < now) { mem.set(key, { n: 1, until: now + windowSec * 1e3 }); return true; }
  return ++cur.n <= max;
}
