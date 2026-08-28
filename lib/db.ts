import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { schema } from "@/db/schema";
import { getDatabaseUrl } from "@/lib/database-url";
import { getCloudDatabase } from "@/lib/db-cloud";
import type { AppDb } from "@/lib/types";

let cached: AppDb | null = null;

export function getDb(): AppDb {
  if (cached) return cached;
  const url = getDatabaseUrl();
  if (url) {
    cached = drizzle(neon(url), { schema });
    return cached;
  }
  const cloud = getCloudDatabase();
  if (cloud) return cloud;
  throw new Error(
    "DATABASE_URL is not set. For cloud dev, run npm run dev:cloud.",
  );
}
