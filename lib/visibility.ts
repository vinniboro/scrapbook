import { sql } from "drizzle-orm";
import { scraps } from "@/db/schema";
import type { AppDb } from "@/lib/types";

/**
 * Author: all. Direct QR connection: public scraps.
 * Group member: group scraps. Logged-out never uses this — callers 404.
 */
export function visibleToViewer(viewerId: string) {
  return sql`(
    ${scraps.authorId} = ${viewerId}
    or (
      ${scraps.visibility} = 'public'
      and exists (
        select 1 from connections c
        where c.user_a_id = least(${viewerId}, ${scraps.authorId})
          and c.user_b_id = greatest(${viewerId}, ${scraps.authorId})
      )
    )
    or (
      ${scraps.visibility} = 'group'
      and ${scraps.groupId} is not null
      and exists (
        select 1 from group_members gm
        where gm.group_id = ${scraps.groupId}
          and gm.user_id = ${viewerId}
      )
    )
  )`;
}

export async function canViewScrap(
  db: AppDb,
  viewerId: string | null,
  scrapId: string,
): Promise<boolean> {
  if (!viewerId) return false;
  const rows = await db
    .select({ id: scraps.id })
    .from(scraps)
    .where(sql`${scraps.id} = ${scrapId} and ${visibleToViewer(viewerId)}`)
    .limit(1);
  return rows.length > 0;
}
