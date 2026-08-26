import { cloudDevEnabled, initCloudDatabase } from "@/lib/db-cloud";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!cloudDevEnabled()) return;
  await initCloudDatabase();
}
