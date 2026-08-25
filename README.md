# Scrapbook plumbing

Google sign-in, QR-only connections, per-scrap public/private visibility. No product UI.

## Env

Copy `.env.example` and set:

- `AUTH_SECRET` — `openssl rand -base64 32`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth client (redirect `https://<host>/api/auth/callback/google`)
- `AUTH_GENESIS_EMAIL` — first member; they get a QR without scanning
- `DATABASE_URL` — Neon Postgres
- `BLOB_READ_WRITE_TOKEN` or a private Blob store connected to the Vercel project (OIDC)
- `AUTH_URL` — public origin

`npm test` runs the visibility/QR suite against in-process Postgres (PGlite). `npm run db:generate` writes Drizzle migrations. Apply them to Neon with `drizzle-kit migrate` once `DATABASE_URL` is set.
