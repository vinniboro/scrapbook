import { and, eq, inArray } from "drizzle-orm";
import { groupMembers, groups, scraps } from "@/db/schema";
import { relationTo } from "@/lib/connections";
import type { AppDb } from "@/lib/types";

export async function isGroupMember(db: AppDb, groupId: string, userId: string) {
  const [row] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createGroup(db: AppDb, ownerId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const [group] = await db
    .insert(groups)
    .values({ name: trimmed.slice(0, 80), ownerId })
    .returning();
  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: ownerId,
    role: "owner",
  });
  return group;
}

export async function listGroupsForUser(db: AppDb, userId: string) {
  const memberships = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));
  if (memberships.length === 0) return [];
  const ids = memberships.map((row) => row.groupId);
  const rows = await db.select().from(groups).where(inArray(groups.id, ids));
  return rows
    .filter((group) => ids.includes(group.id))
    .map((group) => ({
      ...group,
      role: memberships.find((row) => row.groupId === group.id)?.role ?? "member",
    }));
}

export async function renameGroup(
  db: AppDb,
  ownerId: string,
  groupId: string,
  name: string,
) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const [row] = await db
    .update(groups)
    .set({ name: trimmed.slice(0, 80) })
    .where(and(eq(groups.id, groupId), eq(groups.ownerId, ownerId)))
    .returning();
  return row ?? null;
}

export async function deleteGroup(db: AppDb, ownerId: string, groupId: string) {
  const [existing] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.ownerId, ownerId)))
    .limit(1);
  if (!existing) return false;
  await db.delete(scraps).where(eq(scraps.groupId, groupId));
  await db.delete(groups).where(eq(groups.id, groupId));
  return true;
}

export async function addGroupMember(
  db: AppDb,
  ownerId: string,
  groupId: string,
  userId: string,
) {
  const [group] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.ownerId, ownerId)))
    .limit(1);
  if (!group) return { ok: false as const, code: "not_found" as const };
  if (userId === ownerId) return { ok: false as const, code: "self" as const };
  const relation = await relationTo(db, ownerId, userId);
  if (relation !== "direct") return { ok: false as const, code: "not_connected" as const };
  await db
    .insert(groupMembers)
    .values({ groupId, userId, role: "member" })
    .onConflictDoNothing();
  return { ok: true as const };
}

export async function removeGroupMember(
  db: AppDb,
  ownerId: string,
  groupId: string,
  userId: string,
) {
  const [group] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.ownerId, ownerId)))
    .limit(1);
  if (!group) return false;
  if (userId === ownerId) return false;
  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  return true;
}

export async function listGroupMembers(db: AppDb, groupId: string) {
  return db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
}
