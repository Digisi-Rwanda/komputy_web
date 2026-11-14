import { defineConfig } from "drizzle-kit";

// Introspection only: Alembic (ECL-Server) owns migrations. Run `npm run db:pull` after every Alembic upgrade.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/introspect",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
