# Scrapbook

Visual system and heuristics for agents: [`docs/design.md`](docs/design.md). Kit tokens stay; do not invent a second palette. The kit is vendored at `vendor/portfolio-website` so Vercel can install it (`npm run kit:sync` from a sibling `../portfolio-website` checkout).

Exclusive QR connections. Each scrap is **public** (people you have stood with) or in a **named group** (shared channel).

## Scripts

- `npm test` — PGlite visibility and QR suite
- `npm run dev:cloud` — in-memory Postgres when `DATABASE_URL` is unset
- `npm run db:generate` — Drizzle generate
- `npm run db:migrate` — apply `db/migrations` when `DATABASE_URL` is set

## Env

See `.env.example`.

**Vercel / production:** Neon `DATABASE_URL` (or `POSTGRES_URL`). Blank values imported from `.env.example` will fail `db:migrate`. Also set Auth.js `AUTH_SECRET` `AUTH_GOOGLE_ID` `AUTH_GOOGLE_SECRET` `AUTH_URL`, private Blob `BLOB_READ_WRITE_TOKEN` or `BLOB_STORE_ID`. Optional `GOOGLE_BOOKS_API_KEY` for book search (still proxied through `/api/books/search`).

**Genesis bootstrap:** Set `AUTH_GENESIS_EMAIL` to the Google account that should be the first member. That user is onboarded on sign-up and can mint QR codes at `/qr`. Everyone else must scan a QR before they can mint or post — there is no directory or search.

**Local cloud dev:** `npm run dev:cloud` sets `SCRAPBOOK_CLOUD_DEV=1` and uses in-memory PGlite with database sessions (same DB as scrap APIs). Google OAuth still required.

## Deploy

Migrations run before build via `vercel-build` (`npm run db:migrate && npm run build`). Ensure `DATABASE_URL` is set in the Vercel project.
