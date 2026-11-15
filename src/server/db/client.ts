import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/server/env";
import * as schema from "./schema";

// One pool per server process; reused across hot reloads in dev.
const g = globalThis as unknown as { pg?: ReturnType<typeof postgres> };
export const sql = (g.pg ??= postgres(env.DATABASE_URL, { max: env.DB_POOL_MAX, prepare: false }));

export const db = drizzle(sql, { schema, casing: "snake_case" });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export { schema };
