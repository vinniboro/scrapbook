import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { schema } from "@/db/schema";
import { getDatabaseUrl } from "@/lib/database-url";
import type { AppDb } from "@/lib/types";

declare global {
  var __scrapbookCloudDb: AppDb | undefined;
}

let initPromise: Promise<AppDb> | null = null;

export function cloudDevEnabled() {
  return (
    process.env.SCRAPBOOK_CLOUD_DEV === "1" ||
    (!getDatabaseUrl() && process.env.NODE_ENV !== "production")
  );
}

export async function initCloudDatabase(): Promise<AppDb> {
  if (globalThis.__scrapbookCloudDb) return globalThis.__scrapbookCloudDb;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const client = new PGlite();
    const db = drizzle(client, { schema }) as unknown as AppDb;
    await migrate(db as never, {
      migrationsFolder: path.join(process.cwd(), "db/migrations"),
    });
    globalThis.__scrapbookCloudDb = db;
    return db;
  })();

  return initPromise;
}

export function getCloudDatabase(): AppDb | null {
  return globalThis.__scrapbookCloudDb ?? null;
}
