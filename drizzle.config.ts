import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./lib/database-url";

const url = getDatabaseUrl();

if (process.env.VERCEL && !url) {
  throw new Error(
    "DATABASE_URL is empty. Install Neon on this Vercel project (or paste a Postgres URL into Environment Variables for Production and Preview), then redeploy. A blank value imported from .env.example is not a database.",
  );
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: url ?? "postgres://localhost:5432/scrapbook",
  },
});

