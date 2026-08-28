import { and, desc, eq, sql } from "drizzle-orm";
import { scraps, users } from "@/db/schema";
import { relationTo } from "@/lib/connections";
import { isGroupMember } from "@/lib/groups";
import { parseMusicUrl } from "@/lib/music";
import type { AppDb } from "@/lib/types";
import { canViewScrap, visibleToViewer } from "@/lib/visibility";

export const PAGE_SIZE = 20;

export type ImageStore = {
  put: (pathname: string, data: Buffer, contentType: string) => Promise<void>;
  get: (
    pathname: string,
  ) => Promise<{ bytes: Buffer; contentType: string } | null>;
  delete: (pathname: string) => Promise<void>;
};

const memory = new Map<string, { bytes: Buffer; contentType: string }>();

export const memoryImageStore: ImageStore = {
  async put(pathname, data, contentType) {
    memory.set(pathname, { bytes: data, contentType });
  },
  async get(pathname) {
    return memory.get(pathname) ?? null;
  },
  async delete(pathname) {
    memory.delete(pathname);
  },
};

export function resetMemoryImageStore() {
  memory.clear();
}

export type ScrapVisibility = "public" | "group";
export type ScrapType = "text" | "image" | "book" | "music";

type Audience = {
  visibility: ScrapVisibility;
  groupId?: string | null;
};

export type CreateTextScrap = Audience & {
  type: "text";
  body: string;
};

export type CreateImageScrap = Audience & {
  type: "image";
  body?: string;
  bytes: Buffer;
  contentType: string;
};

export type CreateBookScrap = Audience & {
  type: "book";
  googleVolumeId: string;
  bookTitle: string;
  bookAuthors?: string | null;
  bookThumbnailUrl?: string | null;
};

export type CreateMusicScrap = Audience & {
  type: "music";
  musicUrl: string;
  musicTitle?: string;
};

export type CreateScrapInput =
  | CreateTextScrap
  | CreateImageScrap
  | CreateBookScrap
  | CreateMusicScrap;

export function encodeCursor(createdAt: Date, id: string) {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString("base64url");
}

export class BadCursorError extends Error {
  constructor() {
    super("bad cursor");
    this.name = "BadCursorError";
  }
}

export function decodeCursor(cursor: string): { createdAt: Date; id: string } {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const sep = raw.lastIndexOf("|");
    if (sep < 0) throw new BadCursorError();
    const createdAt = new Date(raw.slice(0, sep));
    const id = raw.slice(sep + 1);
    if (!id || Number.isNaN(createdAt.getTime())) throw new BadCursorError();
    return { createdAt, id };
  } catch (error) {
    if (error instanceof BadCursorError) throw error;
    throw new BadCursorError();
  }
}

export function afterCursor(cursor?: string) {
  if (!cursor) return sql`true`;
  const { createdAt, id } = decodeCursor(cursor);
  return sql`(${scraps.createdAt} < ${createdAt} or (${scraps.createdAt} = ${createdAt} and ${scraps.id} < ${id}))`;
}

export type ScrapView = ReturnType<typeof serializeScrap>;

export function serializeScrap(scrap: typeof scraps.$inferSelect) {
  return {
    id: scrap.id,
    authorId: scrap.authorId,
    type: scrap.type,
    visibility: scrap.visibility,
    groupId: scrap.groupId,
    body: scrap.body,
    createdAt: scrap.createdAt.toISOString(),
    image: scrap.type === "image" ? `/api/scraps/${scrap.id}/image` : null,
    book:
      scrap.type === "book"
        ? {
            googleVolumeId: scrap.googleVolumeId,
            title: scrap.bookTitle,
            authors: scrap.bookAuthors,
            thumbnailUrl: scrap.bookThumbnailUrl,
          }
        : null,
    music:
      scrap.type === "music"
        ? {
            url: scrap.musicUrl,
            title: scrap.musicTitle,
            provider: scrap.musicProvider,
          }
        : null,
  };
}

async function assertAudience(
  db: AppDb,
  authorId: string,
  visibility: ScrapVisibility,
  groupId?: string | null,
) {
  if (visibility === "public") return { visibility, groupId: null as string | null };
  if (!groupId) throw new Error("group required");
  const member = await isGroupMember(db, groupId, authorId);
  if (!member) throw new Error("not a group member");
  return { visibility, groupId };
}

export async function createScrap(
  db: AppDb,
  authorId: string,
  input: CreateScrapInput,
  store: ImageStore,
) {
  const audience = await assertAudience(
    db,
    authorId,
    input.visibility,
    input.groupId,
  );
  const id = crypto.randomUUID();
  let blobPathname: string | null = null;
  if (input.type === "image") {
    blobPathname = `scraps/${id}`;
    await store.put(blobPathname, input.bytes, input.contentType);
  }

  const music =
    input.type === "music" ? parseMusicUrl(input.musicUrl) : null;
  if (input.type === "music" && !music) {
    throw new Error("invalid music url");
  }

  try {
    const [row] = await db
      .insert(scraps)
      .values({
        id,
        authorId,
        type: input.type,
        visibility: audience.visibility,
        groupId: audience.groupId,
        body: input.type === "text" ? input.body : input.type === "image" ? (input.body ?? null) : null,
        blobPathname,
        googleVolumeId: input.type === "book" ? input.googleVolumeId : null,
        bookTitle: input.type === "book" ? input.bookTitle : null,
        bookAuthors: input.type === "book" ? (input.bookAuthors ?? null) : null,
        bookThumbnailUrl: input.type === "book" ? (input.bookThumbnailUrl ?? null) : null,
        musicUrl: music?.musicUrl ?? null,
        musicTitle: input.type === "music" ? (input.musicTitle ?? null) : null,
        musicProvider: music?.musicProvider ?? null,
      })
      .returning();
    return row;
  } catch (error) {
    if (blobPathname) {
      await store.delete(blobPathname).catch(() => undefined);
    }
    throw error;
  }
}

export async function getScrapForViewer(
  db: AppDb,
  viewerId: string | null,
  scrapId: string,
) {
  if (!viewerId) return null;
  const allowed = await canViewScrap(db, viewerId, scrapId);
  if (!allowed) return null;
  const [row] = await db.select().from(scraps).where(eq(scraps.id, scrapId)).limit(1);
  return row ?? null;
}

function paginate(rows: (typeof scraps.$inferSelect)[]) {
  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor =
    hasMore && page.length > 0
      ? encodeCursor(page[page.length - 1].createdAt, page[page.length - 1].id)
      : null;
  return { scraps: page.map(serializeScrap), nextCursor };
}

export async function listTimeline(
  db: AppDb,
  viewerId: string,
  cursor?: string,
) {
  const rows = await db
    .select()
    .from(scraps)
    .where(and(visibleToViewer(viewerId), afterCursor(cursor)))
    .orderBy(desc(scraps.createdAt), desc(scraps.id))
    .limit(PAGE_SIZE + 1);
  return paginate(rows);
}

export async function listUserScraps(
  db: AppDb,
  viewerId: string,
  authorId: string,
  cursor?: string,
) {
  const relation = await relationTo(db, viewerId, authorId);
  if (relation === "none") return null;

  const filters = [
    eq(scraps.authorId, authorId),
    visibleToViewer(viewerId),
    afterCursor(cursor),
  ];
  if (relation === "direct") {
    filters.push(eq(scraps.visibility, "public"));
  }

  const rows = await db
    .select()
    .from(scraps)
    .where(and(...filters))
    .orderBy(desc(scraps.createdAt), desc(scraps.id))
    .limit(PAGE_SIZE + 1);

  return { ...paginate(rows), relation };
}

export async function listGroupScraps(
  db: AppDb,
  viewerId: string,
  groupId: string,
  cursor?: string,
) {
  const member = await isGroupMember(db, groupId, viewerId);
  if (!member) return null;
  const rows = await db
    .select()
    .from(scraps)
    .where(
      and(
        eq(scraps.groupId, groupId),
        visibleToViewer(viewerId),
        afterCursor(cursor),
      ),
    )
    .orderBy(desc(scraps.createdAt), desc(scraps.id))
    .limit(PAGE_SIZE + 1);
  return paginate(rows);
}

export async function updateScrap(
  db: AppDb,
  authorId: string,
  scrapId: string,
  patch: { visibility?: ScrapVisibility; groupId?: string | null; body?: string },
) {
  const [existing] = await db
    .select()
    .from(scraps)
    .where(and(eq(scraps.id, scrapId), eq(scraps.authorId, authorId)))
    .limit(1);
  if (!existing) return null;
  const visibility = patch.visibility ?? existing.visibility;
  const groupId =
    patch.groupId !== undefined ? patch.groupId : existing.groupId;
  const audience = await assertAudience(db, authorId, visibility, groupId);
  const [row] = await db
    .update(scraps)
    .set({
      visibility: audience.visibility,
      groupId: audience.groupId,
      body: patch.body ?? existing.body,
    })
    .where(eq(scraps.id, scrapId))
    .returning();
  return row;
}

export async function deleteScrap(
  db: AppDb,
  authorId: string,
  scrapId: string,
  store: ImageStore,
) {
  const [existing] = await db
    .select()
    .from(scraps)
    .where(and(eq(scraps.id, scrapId), eq(scraps.authorId, authorId)))
    .limit(1);
  if (!existing) return false;

  const deleted = await db
    .delete(scraps)
    .where(and(eq(scraps.id, scrapId), eq(scraps.authorId, authorId)))
    .returning();
  if (deleted.length === 0) return false;

  if (existing.blobPathname) {
    await store.delete(existing.blobPathname).catch(() => undefined);
  }
  return true;
}

export async function getScrapImage(
  db: AppDb,
  viewerId: string | null,
  scrapId: string,
  store: ImageStore,
) {
  const scrap = await getScrapForViewer(db, viewerId, scrapId);
  if (!scrap || scrap.type !== "image" || !scrap.blobPathname) return null;
  return store.get(scrap.blobPathname);
}

export async function isMember(db: AppDb, userId: string) {
  const [row] = await db
    .select({ onboardedAt: users.onboardedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return Boolean(row?.onboardedAt);
}

export async function hasCompletedWalkthrough(db: AppDb, userId: string) {
  const [row] = await db
    .select({ walkthroughCompletedAt: users.walkthroughCompletedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return Boolean(row?.walkthroughCompletedAt);
}

export async function completeWalkthrough(db: AppDb, userId: string) {
  await db
    .update(users)
    .set({ walkthroughCompletedAt: new Date() })
    .where(eq(users.id, userId));
}
