import { and, eq, inArray, or, sql } from "drizzle-orm";
import { connections, groupMembers, groups, users } from "@/db/schema";
import type { AppDb } from "@/lib/types";

export function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function connectUsers(db: AppDb, a: string, b: string) {
  if (a === b) {
    return { ok: false as const, code: "self" as const };
  }
  const [userAId, userBId] = orderedPair(a, b);
  await db
    .insert(connections)
    .values({ userAId, userBId })
    .onConflictDoNothing();
  return { ok: true as const };
}

export async function disconnectUsers(db: AppDb, a: string, b: string) {
  const [userAId, userBId] = orderedPair(a, b);
  await db
    .delete(connections)
    .where(
      and(eq(connections.userAId, userAId), eq(connections.userBId, userBId)),
    );
  const ownedByA = await db.select({ id: groups.id }).from(groups).where(eq(groups.ownerId, a));
  const ownedByB = await db.select({ id: groups.id }).from(groups).where(eq(groups.ownerId, b));
  for (const group of ownedByA) {
    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, b)));
  }
  for (const group of ownedByB) {
    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, a)));
  }
}

export async function listConnectionIds(db: AppDb, userId: string) {
  const rows = await db
    .select()
    .from(connections)
    .where(
      or(eq(connections.userAId, userId), eq(connections.userBId, userId)),
    );
  return rows.map((row) =>
    row.userAId === userId ? row.userBId : row.userAId,
  );
}

export async function listConnections(db: AppDb, userId: string) {
  const ids = await listConnectionIds(db, userId);
  if (ids.length === 0) return [];
  const people = await db
    .select({
      id: users.id,
      handle: users.handle,
      name: users.name,
    })
    .from(users)
    .where(inArray(users.id, ids));
  return people;
}

export type Relation = "self" | "direct" | "none";

export async function relationTo(
  db: AppDb,
  viewerId: string,
  otherId: string,
): Promise<Relation> {
  if (viewerId === otherId) return "self";
  const [userAId, userBId] = orderedPair(viewerId, otherId);
  const direct = await db
    .select({ n: sql<number>`1` })
    .from(connections)
    .where(
      and(eq(connections.userAId, userAId), eq(connections.userBId, userBId)),
    )
    .limit(1);
  if (direct.length > 0) return "direct";
  return "none";
}
