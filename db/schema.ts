import type { AdapterAccountType } from "next-auth/adapters";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  handle: text("handle").unique(),
  onboardedAt: timestamp("onboarded_at", { mode: "date" }),
  walkthroughCompletedAt: timestamp("walkthrough_completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  ],
);

export const connections = pgTable(
  "connections",
  {
    userAId: text("user_a_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userBId: text("user_b_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userAId, table.userBId] }),
    check("connections_ordered", sql`${table.userAId} < ${table.userBId}`),
  ],
);

export const connectTokens = pgTable(
  "connect_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    consumedAt: timestamp("consumed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("connect_tokens_user_id_idx").on(table.userId)],
);

export const groups = pgTable(
  "groups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("groups_owner_idx").on(table.ownerId)],
);

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<"owner" | "member">().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.userId] }),
    check("group_members_role_check", sql`${table.role} in ('owner', 'member')`),
    index("group_members_user_idx").on(table.userId),
  ],
);

export const scraps = pgTable(
  "scraps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<"text" | "image" | "book" | "music">().notNull(),
    visibility: text("visibility").$type<"public" | "group">().notNull(),
    groupId: text("group_id").references(() => groups.id, { onDelete: "cascade" }),
    body: text("body"),
    blobPathname: text("blob_pathname"),
    googleVolumeId: text("google_volume_id"),
    bookTitle: text("book_title"),
    bookAuthors: text("book_authors"),
    bookThumbnailUrl: text("book_thumbnail_url"),
    musicUrl: text("music_url"),
    musicTitle: text("music_title"),
    musicProvider: text("music_provider").$type<
      "spotify" | "youtube" | "bandcamp" | "soundcloud" | "other"
    >(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "scraps_type_check",
      sql`${table.type} in ('text', 'image', 'book', 'music')`,
    ),
    check("scraps_visibility_check", sql`${table.visibility} in ('public', 'group')`),
    check(
      "scraps_audience_check",
      sql`(${table.visibility} = 'public' and ${table.groupId} is null) or (${table.visibility} = 'group' and ${table.groupId} is not null)`,
    ),
    index("scraps_author_created_idx").on(
      table.authorId,
      table.createdAt,
      table.id,
    ),
    index("scraps_created_idx").on(table.createdAt, table.id),
    index("scraps_group_idx").on(table.groupId),
  ],
);

export const albums = pgTable(
  "albums",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    visibility: text("visibility").$type<"public" | "group">().notNull(),
    groupId: text("group_id").references(() => groups.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    check("albums_visibility_check", sql`${table.visibility} in ('public', 'group')`),
    check(
      "albums_audience_check",
      sql`(${table.visibility} = 'public' and ${table.groupId} is null) or (${table.visibility} = 'group' and ${table.groupId} is not null)`,
    ),
    index("albums_author_idx").on(table.authorId),
  ],
);

export const albumItems = pgTable(
  "album_items",
  {
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    scrapId: text("scrap_id")
      .notNull()
      .references(() => scraps.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.scrapId] }),
    index("album_items_scrap_idx").on(table.scrapId),
  ],
);

export const redeemAttempts = pgTable(
  "redeem_attempts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bucket: text("bucket").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("redeem_attempts_bucket_created_idx").on(table.bucket, table.createdAt),
  ],
);

export const schema = {
  users,
  accounts,
  sessions,
  verificationTokens,
  authenticators,
  connections,
  connectTokens,
  groups,
  groupMembers,
  scraps,
  albums,
  albumItems,
  redeemAttempts,
};
