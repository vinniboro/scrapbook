import { and, desc, eq, sql } from "drizzle-orm";
import { scraps, users } from "@/db/schema";
import { relationTo } from "@/lib/connections";
import type { AppDb } from "@/lib/types";
import { toSpokenVisibility } from "@/lib/visibility-names";
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

export type ScrapVisibility = "public" | "private";
export type ScrapType = "text" | "image";

export type CreateTextScrap = {
  type: "text";
  visibility: ScrapVisibility;
  body: string;
};

export type CreateImageScrap = {
  type: "image";
  visibility: ScrapVisibility;
  body?: string;
  bytes: Buffer;
  contentType: string;
};

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

function afterCursor(cursor?: string) {
  if (!cursor) return sql`true`;
  const { createdAt, id } = decodeCursor(cursor);
  return sql`(${scraps.createdAt} < ${createdAt} or (${scraps.createdAt} = ${createdAt} and ${scraps.id} < ${id}))`;
}

export function serializeScrap(scrap: typeof scraps.$inferSelect) {
  return {
    id: scrap.id,
    authorId: scrap.authorId,
    type: scrap.type,
    visibility: scrap.visibility,
    place: toSpokenVisibility(scrap.visibility),
    body: scrap.body,
    createdAt: scrap.createdAt.toISOString(),
    image: scrap.type === "image" ? `/api/scraps/${scrap.id}/image` : null,
  };
}

export async function createScrap(
  db: AppDb,
  authorId: string,
  input: CreateTextScrap | CreateImageScrap,
  store: ImageStore,
) {
  const id = crypto.randomUUID();
  let blobPathname: string | null = null;
  if (input.type === "image") {
    blobPathname = `scraps/${id}`;
    await store.put(blobPathname, input.bytes, input.contentType);
  }
  try {
    const [row] = await db
      .insert(scraps)
      .values({
        id,
        authorId,
        type: input.type,
        visibility: input.visibility,
        body: input.type === "text" ? input.body : (input.body ?? null),
        blobPathname,
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

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor =
    hasMore && page.length > 0
      ? encodeCursor(page[page.length - 1].createdAt, page[page.length - 1].id)
      : null;
  return { scraps: page.map(serializeScrap), nextCursor };
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
  if (relation === "twoHop") {
    filters.push(eq(scraps.visibility, "public"));
  }

  const rows = await db
    .select()
    .from(scraps)
    .where(and(...filters))
    .orderBy(desc(scraps.createdAt), desc(scraps.id))
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor =
    hasMore && page.length > 0
      ? encodeCursor(page[page.length - 1].createdAt, page[page.length - 1].id)
      : null;
  return { scraps: page.map(serializeScrap), nextCursor, relation };
}

export async function updateScrap(
  db: AppDb,
  authorId: string,
  scrapId: string,
  patch: { visibility?: ScrapVisibility; body?: string },
) {
  const [existing] = await db
    .select()
    .from(scraps)
    .where(and(eq(scraps.id, scrapId), eq(scraps.authorId, authorId)))
    .limit(1);
  if (!existing) return null;
  const [row] = await db
    .update(scraps)
    .set({
      visibility: patch.visibility ?? existing.visibility,
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
