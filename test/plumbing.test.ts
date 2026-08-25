import { existsSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { connectUsers, disconnectUsers, relationTo } from "@/lib/connections";
import {
  hashToken,
  mintConnectToken,
  redeemToken,
  TOKEN_TTL_MS,
} from "@/lib/connect";
import {
  createScrap,
  getScrapForViewer,
  getScrapImage,
  listTimeline,
  listUserScraps,
  memoryImageStore,
  PAGE_SIZE,
  resetMemoryImageStore,
} from "@/lib/scraps";
import { textScrapSchema } from "@/lib/schemas";
import { canViewScrap } from "@/lib/visibility";
import { createTestDb, insertUser } from "./helpers";

afterEach(() => {
  resetMemoryImageStore();
});

describe("plumbing", () => {
  it("has no search or follow-by-id routes", () => {
    expect(existsSync(path.join(process.cwd(), "app/api/users/search/route.ts"))).toBe(false);
    expect(existsSync(path.join(process.cwd(), "app/api/follows/route.ts"))).toBe(false);
  });

  it("rejects a scrap missing visibility", () => {
    expect(
      textScrapSchema.safeParse({ type: "text", body: "hello" }).success,
    ).toBe(false);
  });

  it("keeps a first-time user empty until they scan, then View All plus friends' public only", async () => {
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
      const user1Private = await createScrap(
        db,
        user1,
        { type: "text", visibility: "private", body: "user1 private" },
        memoryImageStore,
      );
      await createScrap(
        db,
        friend,
        { type: "text", visibility: "public", body: "friend public" },
        memoryImageStore,
      );
      const friendPrivate = await createScrap(
        db,
        friend,
        { type: "text", visibility: "private", body: "friend private" },
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

      const timeline = await listTimeline(db, you);
      const bodies = timeline.scraps.map((scrap) => scrap.body).sort();
      expect(bodies).toEqual(["friend public", "user1 private", "user1 public"]);

      const user1Profile = await listUserScraps(db, you, user1);
      expect(user1Profile?.scraps.map((scrap) => scrap.visibility).sort()).toEqual([
        "private",
        "public",
      ]);

      const friendProfile = await listUserScraps(db, you, friend);
      expect(friendProfile?.relation).toBe("twoHop");
      expect(friendProfile?.scraps.map((scrap) => scrap.body)).toEqual(["friend public"]);
      expect(await canViewScrap(db, you, friendPrivate.id)).toBe(false);
      expect(await getScrapForViewer(db, you, friendPrivate.id)).toBeNull();
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

  it("drops private access in both directions after disconnect", async () => {
    const { db, close } = await createTestDb();
    try {
      const a = await insertUser(db, { handle: "a", email: "a@example.com" });
      const b = await insertUser(db, { handle: "b", email: "b@example.com" });
      await connectUsers(db, a, b);
      const aPrivate = await createScrap(
        db,
        a,
        { type: "text", visibility: "private", body: "secret a" },
        memoryImageStore,
      );
      const bPrivate = await createScrap(
        db,
        b,
        { type: "text", visibility: "private", body: "secret b" },
        memoryImageStore,
      );
      expect(await canViewScrap(db, b, aPrivate.id)).toBe(true);
      expect(await canViewScrap(db, a, bPrivate.id)).toBe(true);

      await disconnectUsers(db, a, b);
      expect(await canViewScrap(db, b, aPrivate.id)).toBe(false);
      expect(await canViewScrap(db, a, bPrivate.id)).toBe(false);
      expect(await listUserScraps(db, a, b)).toBeNull();
    } finally {
      await close();
    }
  });

  it("streams a private image only through the visibility gate", async () => {
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
      const photo = await createScrap(
        db,
        author,
        {
          type: "image",
          visibility: "private",
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

  it("paginates a mixed-visibility hop without leaking private scraps or shrinking pages", async () => {
    const { db, close } = await createTestDb();
    try {
      const you = await insertUser(db, { handle: "viewer", email: "viewer@example.com" });
      const bridge = await insertUser(db, { handle: "bridge", email: "bridge@example.com" });
      const hop = await insertUser(db, { handle: "hop", email: "hop@example.com" });
      await connectUsers(db, you, bridge);
      await connectUsers(db, bridge, hop);

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
      for (let i = 0; i < 5; i += 1) {
        await createScrap(
          db,
          hop,
          { type: "text", visibility: "private", body: `private-${i}` },
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
      expect(second.scraps.some((scrap) => scrap.body?.startsWith("private-"))).toBe(false);
    } finally {
      await close();
    }
  });
});
