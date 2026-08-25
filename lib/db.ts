import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { schema } from "@/db/schema";
import type { AppDb } from "@/lib/types";

let cached: AppDb | null = null;

export function getDb(): AppDb {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}
