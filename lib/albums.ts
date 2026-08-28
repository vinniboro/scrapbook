import { and, eq } from "drizzle-orm";
import { albumItems, albums, scraps } from "@/db/schema";
import { relationTo } from "@/lib/connections";
import { isGroupMember } from "@/lib/groups";
import type { AppDb } from "@/lib/types";
import { canViewScrap } from "@/lib/visibility";

export type AlbumVisibility = "public" | "group";

export async function canViewAlbum(
  db: AppDb,
  viewerId: string,
  album: typeof albums.$inferSelect,
) {
  if (album.authorId === viewerId) return true;
  if (album.visibility === "public") {
    return (await relationTo(db, viewerId, album.authorId)) === "direct";
  }
  if (!album.groupId) return false;
  return Boolean(await isGroupMember(db, album.groupId, viewerId));
}

export async function createAlbum(
  db: AppDb,
  authorId: string,
  input: { title: string; visibility: AlbumVisibility; groupId?: string | null },
) {
  const title = input.title.trim();
  if (!title) return null;
  if (input.visibility === "group") {
    if (!input.groupId) return null;
    const member = await isGroupMember(db, input.groupId, authorId);
    if (!member) return null;
  }
  const [row] = await db
    .insert(albums)
    .values({
      authorId,
      title: title.slice(0, 80),
      visibility: input.visibility,
      groupId: input.visibility === "group" ? input.groupId! : null,
    })
    .returning();
  return row;
}

export async function listAlbumsForAuthor(db: AppDb, authorId: string) {
  return db.select().from(albums).where(eq(albums.authorId, authorId));
}

export async function getAlbumForViewer(
  db: AppDb,
  viewerId: string,
  albumId: string,
) {
  const [album] = await db.select().from(albums).where(eq(albums.id, albumId)).limit(1);
  if (!album) return null;
  if (!(await canViewAlbum(db, viewerId, album))) return null;
  const items = await db
    .select()
    .from(albumItems)
    .where(eq(albumItems.albumId, albumId));
  const ordered = items.sort((a, b) => a.position - b.position);
  const visible = [];
  for (const item of ordered) {
    if (await canViewScrap(db, viewerId, item.scrapId)) {
      visible.push(item);
    }
  }
  return { album, items: visible };
}

export async function addAlbumItem(
  db: AppDb,
  authorId: string,
  albumId: string,
  scrapId: string,
) {
  const [album] = await db
    .select()
    .from(albums)
    .where(and(eq(albums.id, albumId), eq(albums.authorId, authorId)))
    .limit(1);
  if (!album) return { ok: false as const, code: "not_found" as const };
  const [scrap] = await db
    .select()
    .from(scraps)
    .where(and(eq(scraps.id, scrapId), eq(scraps.authorId, authorId)))
    .limit(1);
  if (!scrap) return { ok: false as const, code: "not_found" as const };
  if (album.visibility === "group") {
    const ok =
      scrap.visibility === "public" ||
      (scrap.visibility === "group" && scrap.groupId === album.groupId);
    if (!ok) return { ok: false as const, code: "leak" as const };
  }
  const existing = await db
    .select()
    .from(albumItems)
    .where(eq(albumItems.albumId, albumId));
  const position = existing.length;
  await db
    .insert(albumItems)
    .values({ albumId, scrapId, position })
    .onConflictDoNothing();
  return { ok: true as const };
}

export async function removeAlbumItem(
  db: AppDb,
  authorId: string,
  albumId: string,
  scrapId: string,
) {
  const [album] = await db
    .select()
    .from(albums)
    .where(and(eq(albums.id, albumId), eq(albums.authorId, authorId)))
    .limit(1);
  if (!album) return false;
  await db
    .delete(albumItems)
    .where(and(eq(albumItems.albumId, albumId), eq(albumItems.scrapId, scrapId)));
  return true;
}

export async function deleteAlbum(db: AppDb, authorId: string, albumId: string) {
  const deleted = await db
    .delete(albums)
    .where(and(eq(albums.id, albumId), eq(albums.authorId, authorId)))
    .returning();
  return deleted.length > 0;
}
