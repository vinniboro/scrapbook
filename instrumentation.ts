export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { cloudDevEnabled, initCloudDatabase } = await import("@/lib/db-cloud");
  if (!cloudDevEnabled()) return;
  await initCloudDatabase();
}
