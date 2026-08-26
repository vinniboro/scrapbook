import { existsSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { connectUsers, disconnectUsers, relationTo } from "@/lib/connections";
import {
  enforceMintRateLimit,
  enforceScrapCreateRateLimit,
  hashToken,
  mintConnectToken,
  MINT_MAX_PER_BUCKET,
  REDEEM_MAX_PER_BUCKET,
  redeemToken,
  TOKEN_TTL_MS,
} from "@/lib/connect";
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
  updateScrap,
} from "@/lib/scraps";
import { textScrapSchema } from "@/lib/schemas";
import { validateImageInput } from "@/lib/upload";
import { finishNewUser } from "@/lib/users";
import { canViewScrap } from "@/lib/visibility";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
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

  it("accepts room and close as spoken visibility", () => {
    expect(
      textScrapSchema.parse({ type: "text", visibility: "room", body: "hello" })
        .visibility,
    ).toBe("public");
    expect(
      textScrapSchema.parse({ type: "text", visibility: "close", body: "hello" })
        .visibility,
    ).toBe("private");
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
      expect(timeline.scraps.some((scrap) => scrap.place === "close")).toBe(true);
      expect(timeline.scraps.some((scrap) => scrap.place === "room")).toBe(true);
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

  it("allows only one concurrent redeem of the same QR token", async () => {
    const { db, close } = await createTestDb();
    try {
      const host = await insertUser(db, { handle: "host", email: "host@example.com" });
      const guestA = await insertUser(db, {
        handle: "guest-a",
        email: "guest-a@example.com",
        onboarded: false,
      });
      const guestB = await insertUser(db, {
        handle: "guest-b",
        email: "guest-b@example.com",
        onboarded: false,
      });
      const token = await mintConnectToken(db, host);

      const [first, second] = await Promise.all([
        redeemToken(db, { viewerId: guestA, token, ip: "10.0.0.1" }),
        redeemToken(db, { viewerId: guestB, token, ip: "10.0.0.2" }),
      ]);

      const winners = [first, second].filter((result) => result.ok);
      expect(winners).toHaveLength(1);
      expect(winners[0]).toEqual({ ok: true, otherUserId: host });
    } finally {
      await close();
    }
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
          visibility: "private",
          bytes: Buffer.from("delete-me"),
          contentType: "image/png",
        },
        memoryImageStore,
      );
      expect(photo.blobPathname).toBeTruthy();
      expect(await memoryImageStore.get(photo.blobPathname!)).not.toBeNull();

      const deleted = await deleteScrap(db, author, photo.id, memoryImageStore);
      expect(deleted).toBe(true);
      expect(await memoryImageStore.get(photo.blobPathname!)).toBeNull();
    } finally {
      await close();
    }
  });

  it("rejects unsupported or oversized images through the shared gate", () => {
    expect(
      validateImageInput({
        contentType: "application/pdf",
        size: 1024,
      }),
    ).toBe("unsupported");
    expect(
      validateImageInput({
        contentType: "image/png",
        size: 9 * 1024 * 1024,
      }),
    ).toBe("too_large");
    expect(
      validateImageInput({
        contentType: "image/png",
        size: 1024,
      }),
    ).toBeNull();
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

  it("returns rate_limit when redeem attempts exceed the bucket", async () => {
    const { db, close } = await createTestDb();
    try {
      const host = await insertUser(db, { handle: "host", email: "host@example.com" });
      const guest = await insertUser(db, {
        handle: "guest",
        email: "guest@example.com",
        onboarded: false,
      });

      for (let i = 0; i < REDEEM_MAX_PER_BUCKET; i += 1) {
        const token = await mintConnectToken(db, host);
        await redeemToken(db, {
          viewerId: guest,
          token,
          ip: `3.3.3.${i}`,
        });
      }

      const blocked = await redeemToken(db, {
        viewerId: guest,
        token: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        ip: "3.3.3.99",
      });
      expect(blocked).toEqual({ ok: false, code: "rate_limit" });
    } finally {
      await close();
    }
  });

  it("rate-limits QR mint and scrap create buckets", async () => {
    const { db, close } = await createTestDb();
    try {
      const member = await insertUser(db, {
        handle: "member",
        email: "member@example.com",
      });

      for (let i = 0; i < MINT_MAX_PER_BUCKET; i += 1) {
        expect(await enforceMintRateLimit(db, member, `4.4.4.${i}`)).toBe(true);
      }
      expect(await enforceMintRateLimit(db, member, "4.4.4.99")).toBe(false);

      for (let i = 0; i < 40; i += 1) {
        expect(
          await enforceScrapCreateRateLimit(db, member, `5.5.5.${i}`),
        ).toBe(true);
      }
      expect(await enforceScrapCreateRateLimit(db, member, "5.5.5.99")).toBe(
        false,
      );
    } finally {
      await close();
    }
  });

  it("lets only the author patch or delete a scrap", async () => {
    const { db, close } = await createTestDb();
    try {
      const author = await insertUser(db, {
        handle: "author",
        email: "author@example.com",
      });
      const other = await insertUser(db, {
        handle: "other",
        email: "other@example.com",
      });
      const scrap = await createScrap(
        db,
        author,
        { type: "text", visibility: "public", body: "mine" },
        memoryImageStore,
      );

      expect(
        await updateScrap(db, author, scrap.id, { body: "updated" }),
      ).toBeTruthy();
      expect(await updateScrap(db, other, scrap.id, { body: "stolen" })).toBeNull();
      expect(await deleteScrap(db, other, scrap.id, memoryImageStore)).toBe(false);
      expect(await deleteScrap(db, author, scrap.id, memoryImageStore)).toBe(true);
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
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      expect(row?.onboardedAt).toBeTruthy();
      expect(row?.handle).toBeTruthy();
      process.env.AUTH_GENESIS_EMAIL = previous;
    } finally {
      await close();
    }
  });
});
