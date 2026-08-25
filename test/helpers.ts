import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { schema, users } from "@/db/schema";
import type { AppDb } from "@/lib/types";

export async function createTestDb(): Promise<{ db: AppDb; close: () => Promise<void> }> {
  const client = new PGlite();
  const db = drizzle(client, { schema }) as unknown as AppDb;
  await migrate(db as never, {
    migrationsFolder: path.join(process.cwd(), "db/migrations"),
  });
  return {
    db,
    close: async () => {
      await client.close();
    },
  };
}

export async function insertUser(
  db: AppDb,
  input: {
    id?: string;
    handle: string;
    email: string;
    onboarded?: boolean;
  },
) {
  const id = input.id ?? crypto.randomUUID();
  await db.insert(users).values({
    id,
    handle: input.handle,
    email: input.email,
    name: input.handle,
    onboardedAt: input.onboarded === false ? null : new Date(),
    createdAt: new Date(),
  });
  return id;
}
