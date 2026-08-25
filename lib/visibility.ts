import { sql } from "drizzle-orm";
import { scraps } from "@/db/schema";
import type { AppDb } from "@/lib/types";

/**
 * SQL predicate for a scrap the viewer may see.
 * Author: all. Direct QR connection: all (View All, including past private).
 * Friend of a connection: public only. Logged-out never uses this — callers 404.
 */
export function visibleToViewer(viewerId: string) {
  return sql`(
    ${scraps.authorId} = ${viewerId}
    or exists (
      select 1 from connections c
      where c.user_a_id = least(${viewerId}, ${scraps.authorId})
        and c.user_b_id = greatest(${viewerId}, ${scraps.authorId})
    )
    or (
      ${scraps.visibility} = 'public'
      and exists (
        select 1
        from connections vx
        join connections xa on (
          (
            vx.user_a_id = ${viewerId}
            and xa.user_a_id = least(vx.user_b_id, ${scraps.authorId})
            and xa.user_b_id = greatest(vx.user_b_id, ${scraps.authorId})
          )
          or (
            vx.user_b_id = ${viewerId}
            and xa.user_a_id = least(vx.user_a_id, ${scraps.authorId})
            and xa.user_b_id = greatest(vx.user_a_id, ${scraps.authorId})
          )
        )
        where ${scraps.authorId} <> ${viewerId}
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
