import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import type { AppDb } from "@/lib/types";

export function slugifyHandle(source: string) {
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return slug.length > 0 ? slug : "member";
}

export async function uniqueHandle(
  db: AppDb,
  name?: string | null,
  email?: string | null,
) {
  const base = slugifyHandle(name || email?.split("@")[0] || "member");
  for (let i = 0; i < 8; i += 1) {
    const candidate = i === 0 ? base : `${base}-${crypto.randomUUID().slice(0, 4)}`;
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.handle, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function finishNewUser(
  db: AppDb,
  user: { id: string; name?: string | null; email?: string | null },
) {
  const handle = await uniqueHandle(db, user.name, user.email);
  const genesis = process.env.AUTH_GENESIS_EMAIL;
  const onboardedAt =
    genesis && user.email && user.email.toLowerCase() === genesis.toLowerCase()
      ? new Date()
      : null;
  await db
    .update(users)
    .set({ handle, onboardedAt })
    .where(eq(users.id, user.id));
}

export async function updateProfile(
  db: AppDb,
  userId: string,
  patch: { name?: string; handle?: string },
) {
  if (patch.handle) {
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.handle, patch.handle))
      .limit(1);
    if (taken && taken.id !== userId) return null;
  }
  const [row] = await db
    .update(users)
    .set({
      ...(patch.name ? { name: patch.name } : {}),
      ...(patch.handle ? { handle: patch.handle } : {}),
    })
    .where(eq(users.id, userId))
    .returning();
  return row ?? null;
}
