import { existsSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { addAlbumItem, createAlbum } from "@/lib/albums";
import { connectUsers, disconnectUsers, relationTo } from "@/lib/connections";
import {
  hashToken,
  mintConnectToken,
  redeemToken,
  TOKEN_TTL_MS,
} from "@/lib/connect";
import { addGroupMember, createGroup } from "@/lib/groups";
import { parseMusicUrl } from "@/lib/music";
import {
  BadCursorError,
  createScrap,
  decodeCursor,
  deleteScrap,
  getScrapForViewer,
  getScrapImage,
  listTimeline,
  listUserScraps,
  memoryImageStore,
  PAGE_SIZE,
  resetMemoryImageStore,
} from "@/lib/scraps";
import { textScrapSchema } from "@/lib/schemas";
import { validateImageInput } from "@/lib/upload";
import { finishNewUser } from "@/lib/users";
import { getDatabaseUrl } from "@/lib/database-url";
import { canViewScrap } from "@/lib/visibility";
import { createTestDb, insertUser } from "./helpers";

afterEach(() => {
  resetMemoryImageStore();
});

describe("plumbing", () => {
  it("treats a blank DATABASE_URL as unset and prefers POSTGRES_URL", () => {
    const previous = {
      DATABASE_URL: process.env.DATABASE_URL,
      POSTGRES_URL: process.env.POSTGRES_URL,
    };
    try {
      process.env.DATABASE_URL = "";
      process.env.POSTGRES_URL = "postgres://neon.example/scrapbook";
      expect(getDatabaseUrl()).toBe("postgres://neon.example/scrapbook");
    } finally {
      if (previous.DATABASE_URL === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previous.DATABASE_URL;
      if (previous.POSTGRES_URL === undefined) delete process.env.POSTGRES_URL;
      else process.env.POSTGRES_URL = previous.POSTGRES_URL;
    }
  });

  it("has no search or follow-by-id routes", () => {
    expect(existsSync(path.join(process.cwd(), "app/api/users/search/route.ts"))).toBe(false);
    expect(existsSync(path.join(process.cwd(), "app/api/follows/route.ts"))).toBe(false);
  });

  it("rejects a scrap missing visibility", () => {
    expect(
      textScrapSchema.safeParse({ type: "text", body: "hello" }).success,
    ).toBe(false);
  });

  it("accepts public and group audience", () => {
    expect(
      textScrapSchema.parse({ type: "text", visibility: "public", body: "hello" })
        .visibility,
    ).toBe("public");
    expect(
      textScrapSchema.parse({
        type: "text",
        visibility: "group",
        groupId: "550e8400-e29b-41d4-a716-446655440000",
        body: "hello",
      }).visibility,
    ).toBe("group");
  });

  it("keeps a first-time user empty until they scan, then public plus group membership", async () => {
    const { db, close } = await createTestDb();
    try {
      const you = await insertUser(db, {
        handle: "you",
        email: "you@example.com",
        onboarded: false,
      });
      const user1 = await insertUser(db, {
        handle: "user1",
        email: "user1@example.com",
      });
      const friend = await insertUser(db, {
        handle: "friend",
        email: "friend@example.com",
      });
      await connectUsers(db, user1, friend);

      await createScrap(
        db,
        user1,
        { type: "text", visibility: "public", body: "user1 public" },
        memoryImageStore,
      );
      const closeGroup = await createGroup(db, user1, "close");
      const user1Private = await createScrap(
        db,
        user1,
        {
          type: "text",
          visibility: "group",
          groupId: closeGroup!.id,
          body: "user1 group",
        },
        memoryImageStore,
      );
      await createScrap(
        db,
        friend,
        { type: "text", visibility: "public", body: "friend public" },
        memoryImageStore,
      );
      const friendGroup = await createGroup(db, friend, "secret");
      const friendPrivate = await createScrap(
        db,
        friend,
        {
          type: "text",
          visibility: "group",
          groupId: friendGroup!.id,
          body: "friend group",
        },
        memoryImageStore,
      );

      const empty = await listTimeline(db, you);
      expect(empty.scraps).toEqual([]);
      expect(await listUserScraps(db, you, user1)).toBeNull();
      expect(await canViewScrap(db, you, user1Private.id)).toBe(false);
      expect(await getScrapForViewer(db, null, user1Private.id)).toBeNull();

      const token = await mintConnectToken(db, user1);
      const redeemed = await redeemToken(db, {
        viewerId: you,
        token,
        ip: "1.1.1.1",
      });
      expect(redeemed).toEqual({ ok: true, otherUserId: user1 });
      expect(await relationTo(db, you, user1)).toBe("direct");
      expect(await relationTo(db, user1, you)).toBe("direct");
      expect(await relationTo(db, you, friend)).toBe("none");

      const timeline = await listTimeline(db, you);
      const bodies = timeline.scraps.map((scrap) => scrap.body).sort();
      expect(bodies).toEqual(["user1 public"]);
      expect(timeline.scraps.some((scrap) => scrap.visibility === "group")).toBe(false);

      const user1Profile = await listUserScraps(db, you, user1);
      expect(user1Profile?.scraps.map((scrap) => scrap.body)).toEqual(["user1 public"]);
      expect(await listUserScraps(db, you, friend)).toBeNull();
      expect(await canViewScrap(db, you, friendPrivate.id)).toBe(false);
      expect(await getScrapForViewer(db, you, friendPrivate.id)).toBeNull();
    } finally {
      await close();
    }
  });

  it("shows group scraps only to members, not to other connections", async () => {
    const { db, close } = await createTestDb();
    try {
      const owner = await insertUser(db, { handle: "owner", email: "owner@example.com" });
      const pal = await insertUser(db, { handle: "pal", email: "pal@example.com" });
      const other = await insertUser(db, { handle: "other", email: "other@example.com" });
      await connectUsers(db, owner, pal);
      await connectUsers(db, owner, other);
      const group = await createGroup(db, owner, "kitchen");
      await addGroupMember(db, owner, group!.id, pal);
      const scrap = await createScrap(
        db,
        owner,
        { type: "text", visibility: "group", groupId: group!.id, body: "channel" },
        memoryImageStore,
      );
      expect(await canViewScrap(db, pal, scrap.id)).toBe(true);
      expect(await canViewScrap(db, other, scrap.id)).toBe(false);
    } finally {
      await close();
    }
  });

  it("rejects a spent, expired, own, or garbage QR token", async () => {
    const { db, close } = await createTestDb();
    try {
      const host = await insertUser(db, { handle: "host", email: "host@example.com" });
      const guest = await insertUser(db, {
        handle: "guest",
        email: "guest@example.com",
        onboarded: false,
      });

      const token = await mintConnectToken(db, host);
      const first = await redeemToken(db, {
        viewerId: guest,
        token,
        ip: "2.2.2.2",
      });
      expect(first.ok).toBe(true);
      const reuse = await redeemToken(db, {
        viewerId: guest,
        token,
        ip: "2.2.2.2",
      });
      expect(reuse).toEqual({ ok: false, code: "invalid" });

      const fresh = await mintConnectToken(db, host);
      const expired = await redeemToken(db, {
        viewerId: guest,
        token: fresh,
        ip: "2.2.2.2",
        at: new Date(Date.now() + TOKEN_TTL_MS + 1000),
      });
      expect(expired).toEqual({ ok: false, code: "expired" });

      const own = await mintConnectToken(db, host);
      const self = await redeemToken(db, {
        viewerId: host,
        token: own,
        ip: "2.2.2.2",
      });
      expect(self).toEqual({ ok: false, code: "self" });

      const garbage = await redeemToken(db, {
        viewerId: guest,
        token: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        ip: "2.2.2.2",
      });
      expect(garbage).toEqual({ ok: false, code: "invalid" });
      expect(hashToken(own)).toHaveLength(64);
    } finally {
      await close();
    }
  });

  it("drops group membership after disconnect", async () => {
    const { db, close } = await createTestDb();
    try {
      const a = await insertUser(db, { handle: "a", email: "a@example.com" });
      const b = await insertUser(db, { handle: "b", email: "b@example.com" });
      await connectUsers(db, a, b);
      const group = await createGroup(db, a, "kitchen");
      await addGroupMember(db, a, group!.id, b);
      const secret = await createScrap(
        db,
        a,
        { type: "text", visibility: "group", groupId: group!.id, body: "secret a" },
        memoryImageStore,
      );
      expect(await canViewScrap(db, b, secret.id)).toBe(true);

      await disconnectUsers(db, a, b);
      expect(await canViewScrap(db, b, secret.id)).toBe(false);
      expect(await listUserScraps(db, a, b)).toBeNull();
    } finally {
      await close();
    }
  });

  it("streams a group image only through the visibility gate", async () => {
    const { db, close } = await createTestDb();
    try {
      const author = await insertUser(db, {
        handle: "author",
        email: "author@example.com",
      });
      const friend = await insertUser(db, {
        handle: "pal",
        email: "pal@example.com",
      });
      const stranger = await insertUser(db, {
        handle: "stranger",
        email: "stranger@example.com",
      });
      await connectUsers(db, author, friend);
      const group = await createGroup(db, author, "photos");
      await addGroupMember(db, author, group!.id, friend);
      const photo = await createScrap(
        db,
        author,
        {
          type: "image",
          visibility: "group",
          groupId: group!.id,
          bytes: Buffer.from("hello-image"),
          contentType: "image/png",
        },
        memoryImageStore,
      );

      const allowed = await getScrapImage(db, friend, photo.id, memoryImageStore);
      expect(allowed?.bytes.toString()).toBe("hello-image");
      expect(await getScrapImage(db, stranger, photo.id, memoryImageStore)).toBeNull();
      expect(await getScrapImage(db, null, photo.id, memoryImageStore)).toBeNull();
      expect(photo.blobPathname).toBe(`scraps/${photo.id}`);
    } finally {
      await close();
    }
  });

  it("paginates public scraps without leaking group scraps or shrinking pages", async () => {
    const { db, close } = await createTestDb();
    try {
      const you = await insertUser(db, { handle: "viewer", email: "viewer@example.com" });
      const hop = await insertUser(db, { handle: "hop", email: "hop@example.com" });
      await connectUsers(db, you, hop);

      for (let i = 0; i < 25; i += 1) {
        await createScrap(
          db,
          hop,
          {
            type: "text",
            visibility: "public",
            body: `public-${i}`,
          },
          memoryImageStore,
        );
      }
      const group = await createGroup(db, hop, "hidden");
      for (let i = 0; i < 5; i += 1) {
        await createScrap(
          db,
          hop,
          { type: "text", visibility: "group", groupId: group!.id, body: `group-${i}` },
          memoryImageStore,
        );
      }

      const first = await listTimeline(db, you);
      expect(first.scraps).toHaveLength(PAGE_SIZE);
      expect(first.scraps.every((scrap) => scrap.visibility === "public")).toBe(true);
      expect(first.nextCursor).toBeTruthy();

      const second = await listTimeline(db, you, first.nextCursor ?? undefined);
      expect(second.scraps).toHaveLength(5);
      expect(second.scraps.every((scrap) => scrap.visibility === "public")).toBe(true);
      expect(second.nextCursor).toBeNull();
      expect(second.scraps.some((scrap) => scrap.body?.startsWith("group-"))).toBe(false);
    } finally {
      await close();
    }
  });

  it("refuses to put a different group's scrap into an album", async () => {
    const { db, close } = await createTestDb();
    try {
      const author = await insertUser(db, { handle: "author", email: "a@example.com" });
      const pal = await insertUser(db, { handle: "pal", email: "p@example.com" });
      await connectUsers(db, author, pal);
      const kitchen = await createGroup(db, author, "kitchen");
      const attic = await createGroup(db, author, "attic");
      await addGroupMember(db, author, kitchen!.id, pal);
      const hidden = await createScrap(
        db,
        author,
        { type: "text", visibility: "group", groupId: attic!.id, body: "attic note" },
        memoryImageStore,
      );
      const album = await createAlbum(db, author, {
        title: "kitchen mix",
        visibility: "group",
        groupId: kitchen!.id,
      });
      const result = await addAlbumItem(db, author, album!.id, hidden.id);
      expect(result).toEqual({ ok: false, code: "leak" });
    } finally {
      await close();
    }
  });

  it("parses music urls without fetching", () => {
    expect(parseMusicUrl("https://open.spotify.com/track/abc")?.musicProvider).toBe(
      "spotify",
    );
    expect(parseMusicUrl("not-a-url")).toBeNull();
  });

  it("deletes image blobs when a scrap is removed", async () => {
    const { db, close } = await createTestDb();
    try {
      const author = await insertUser(db, {
        handle: "author",
        email: "author@example.com",
      });
      const photo = await createScrap(
        db,
        author,
        {
          type: "image",
          visibility: "public",
          bytes: Buffer.from("delete-me"),
          contentType: "image/png",
        },
        memoryImageStore,
      );
      expect(await memoryImageStore.get(photo.blobPathname!)).not.toBeNull();
      expect(await deleteScrap(db, author, photo.id, memoryImageStore)).toBe(true);
      expect(await memoryImageStore.get(photo.blobPathname!)).toBeNull();
    } finally {
      await close();
    }
  });

  it("rejects unsupported or oversized images through the shared gate", () => {
    expect(validateImageInput({ contentType: "application/pdf", size: 1024 })).toBe(
      "unsupported",
    );
    expect(
      validateImageInput({ contentType: "image/png", size: 9 * 1024 * 1024 }),
    ).toBe("too_large");
  });

  it("throws BadCursorError for malformed cursors", async () => {
    expect(() => decodeCursor("not-a-cursor")).toThrow(BadCursorError);
    const { db, close } = await createTestDb();
    try {
      const viewer = await insertUser(db, {
        handle: "viewer",
        email: "viewer@example.com",
      });
      await expect(listTimeline(db, viewer, "bad-cursor")).rejects.toThrow(
        BadCursorError,
      );
    } finally {
      await close();
    }
  });

  it("onboards the genesis email without a scan", async () => {
    const { db, close } = await createTestDb();
    try {
      const genesisEmail = "genesis@example.com";
      const previous = process.env.AUTH_GENESIS_EMAIL;
      process.env.AUTH_GENESIS_EMAIL = genesisEmail;
      const userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        email: genesisEmail,
        name: "Genesis",
      });
      await finishNewUser(db, {
        id: userId,
        name: "Genesis",
        email: genesisEmail,
      });
      const [row] = await db.select().from(users).where(eq(users.id, userId));
      expect(row?.onboardedAt).toBeTruthy();
      process.env.AUTH_GENESIS_EMAIL = previous;
    } finally {
      await close();
    }
  });
});
