// Applies db/migrations/*.sql in name order, once each, inside one transaction per file.
// Runs as the Render pre-deploy step (and `npm run db:migrate` locally). Safe to run concurrently (advisory lock).
// A database that already has the web tables (created by the previous engine) gets the baseline marked as applied.
import { readdir, readFile } from "node:fs/promises";
import postgres from "postgres";

const dir = new URL("../db/migrations/", import.meta.url);
const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
try {
  await sql`select pg_advisory_lock(727001)`;
  await sql`create table if not exists public.web_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const done = new Set((await sql`select name from public.web_migrations`).map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    if (f.startsWith("0000_") && (await sql`select to_regclass('public.users') as t`)[0].t) {
      await sql`insert into public.web_migrations (name) values (${f})`;
      console.log(`baseline ${f}: tables exist, marked applied`);
      continue;
    }
    const body = await readFile(new URL(f, dir), "utf8");
    await sql.begin(async (tx) => { await tx.unsafe(body); await tx`insert into public.web_migrations (name) values (${f})`; });
    console.log(`applied ${f}`);
  }
  console.log(`migrations up to date (${files.length})`);
} finally {
  await sql.end();
}
