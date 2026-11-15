import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/server/db/client";

// Render health check + external uptime monitor: this instance serves requests and reaches its database.
export async function GET() {
  await connection();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ status: "db_unreachable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
