# Komputy web

**Naming:** the product is **Komputy** (komputy.com). "ECL" names only the IFRS 9 Expected Credit Loss module, never the product. No em or en dashes in text, code or docs (CI enforces both).

The Komputy web app (Next.js 16, App Router): marketing site, sign-in (Better Auth), workspaces, administration,
notifications and email, and the screens for Expected Credit Loss (IFRS 9) and Lease Accounting (IFRS 16).
Calculations run in the engine, [`komputy_server`](https://github.com/Digisi-Rwanda/komputy_server), reached over
Render's private network with short-lived RS256 tokens signed by this app (`/api/auth/jwks`).

## Run locally

```bash
npm install
npm run db:migrate          # web tables (db/migrations/*.sql) into DATABASE_URL
npm run db:seed             # demo workspaces and users (local only)
npm run dev                 # http://localhost:3000 (the engine runs from komputy_server: make api / make worker)
```

Settings are validated at start-up in `src/server/env.ts` (database, Better Auth secret and URL, cron secret,
IP hash salt, engine URL, Resend key).

## Checks

```bash
npm run check               # route types, typecheck, lint, unit tests, production build
node scripts/e2e-engine.mjs # live browser journeys (also e2e-leases.mjs, e2e-platform.mjs)
```

## Production

Deployed on Render from `main` after CI passes; infrastructure, runbook and plans live in `komputy_server`
(`render.yaml`, `docs/DEPLOYMENT_PLAN.md`, `docs/RUNBOOK.md`). Database changes: add a numbered SQL file to
`db/migrations/`; the pre-deploy step applies it before new code takes traffic. Icons come from the mark in
`src/app/icon.svg` (`node scripts/build-icons.mjs`).
