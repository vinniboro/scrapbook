import { and, eq, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { connections, users } from "@/db/schema";
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

export type Relation = "self" | "direct" | "twoHop" | "none";

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

  const vx = alias(connections, "vx");
  const xa = alias(connections, "xa");
  const hop = await db
    .select({ n: sql<number>`1` })
    .from(vx)
    .innerJoin(
      xa,
      or(
        and(
          eq(vx.userAId, viewerId),
          sql`${xa.userAId} = least(${vx.userBId}, ${otherId})`,
          sql`${xa.userBId} = greatest(${vx.userBId}, ${otherId})`,
        ),
        and(
          eq(vx.userBId, viewerId),
          sql`${xa.userAId} = least(${vx.userAId}, ${otherId})`,
          sql`${xa.userBId} = greatest(${vx.userAId}, ${otherId})`,
        ),
      ),
    )
    .limit(1);

  if (hop.length > 0) return "twoHop";
  return "none";
}
