import { defineConfig } from "drizzle-kit";

// Introspection only. Web tables: SQL files in db/migrations (npm run db:migrate, Render pre-deploy); engine schema: komputy_server Alembic. Run `npm run db:pull` after a schema change.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/introspect",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
