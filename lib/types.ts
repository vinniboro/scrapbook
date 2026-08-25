import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { schema } from "@/db/schema";

export type AppDb =
  | NeonHttpDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;
