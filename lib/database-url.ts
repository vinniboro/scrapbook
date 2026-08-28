const URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
] as const;

/** First non-empty Postgres URL. Empty Vercel imports of `.env.example` do not count. */
export function getDatabaseUrl(): string | undefined {
  for (const key of URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}
