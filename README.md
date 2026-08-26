# Scrapbook

Exclusive QR connections. Per-scrap place: `room` (next room) or `close` (people you stood with). Stored as `public` / `private`.

## Scripts

- `npm test` — PGlite visibility and QR suite
- `npm run dev:cloud` — in-memory Postgres when `DATABASE_URL` is unset
- `npm run db:generate` — Drizzle generate
- `npm run db:migrate` — apply `db/migrations` when `DATABASE_URL` is set

## Env

See `.env.example`. Vercel: Neon `DATABASE_URL`, Auth.js `AUTH_SECRET` `AUTH_GOOGLE_ID` `AUTH_GOOGLE_SECRET` `AUTH_URL` `AUTH_GENESIS_EMAIL`, private Blob `BLOB_READ_WRITE_TOKEN` or OIDC.
