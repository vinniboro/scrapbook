CREATE TABLE "album_items" (
	"album_id" text NOT NULL,
	"scrap_id" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "album_items_album_id_scrap_id_pk" PRIMARY KEY("album_id","scrap_id")
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"visibility" text NOT NULL,
	"group_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "albums_visibility_check" CHECK ("albums"."visibility" in ('public', 'group')),
	CONSTRAINT "albums_audience_check" CHECK (("albums"."visibility" = 'public' and "albums"."group_id" is null) or ("albums"."visibility" = 'group' and "albums"."group_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_members_group_id_user_id_pk" PRIMARY KEY("group_id","user_id"),
	CONSTRAINT "group_members_role_check" CHECK ("group_members"."role" in ('owner', 'member'))
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scraps" DROP CONSTRAINT "scraps_type_check";--> statement-breakpoint
ALTER TABLE "scraps" DROP CONSTRAINT "scraps_visibility_check";--> statement-breakpoint
ALTER TABLE "scraps" ADD COLUMN "group_id" text;--> statement-breakpoint
ALTER TABLE "scraps" ADD COLUMN "google_volume_id" text;--> statement-breakpoint
ALTER TABLE "scraps" ADD COLUMN "book_title" text;--> statement-breakpoint
ALTER TABLE "scraps" ADD COLUMN "book_authors" text;--> statement-breakpoint
ALTER TABLE "scraps" ADD COLUMN "book_thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "scraps" ADD COLUMN "music_url" text;--> statement-breakpoint
ALTER TABLE "scraps" ADD COLUMN "music_title" text;--> statement-breakpoint
ALTER TABLE "scraps" ADD COLUMN "music_provider" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "walkthrough_completed_at" timestamp;--> statement-breakpoint
INSERT INTO "groups" ("id", "name", "owner_id", "created_at")
SELECT 'close-' || "author_id", 'close', "author_id", now()
FROM "scraps"
WHERE "visibility" = 'private'
GROUP BY "author_id";--> statement-breakpoint
INSERT INTO "group_members" ("group_id", "user_id", "role", "created_at")
SELECT 'close-' || "author_id", "author_id", 'owner', now()
FROM "scraps"
WHERE "visibility" = 'private'
GROUP BY "author_id";--> statement-breakpoint
UPDATE "scraps"
SET "visibility" = 'group', "group_id" = 'close-' || "author_id"
WHERE "visibility" = 'private';--> statement-breakpoint
ALTER TABLE "album_items" ADD CONSTRAINT "album_items_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_items" ADD CONSTRAINT "album_items_scrap_id_scraps_id_fk" FOREIGN KEY ("scrap_id") REFERENCES "public"."scraps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "album_items_scrap_idx" ON "album_items" USING btree ("scrap_id");--> statement-breakpoint
CREATE INDEX "albums_author_idx" ON "albums" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "group_members_user_idx" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "groups_owner_idx" ON "groups" USING btree ("owner_id");--> statement-breakpoint
ALTER TABLE "scraps" ADD CONSTRAINT "scraps_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scraps_group_idx" ON "scraps" USING btree ("group_id");--> statement-breakpoint
ALTER TABLE "scraps" ADD CONSTRAINT "scraps_audience_check" CHECK (("scraps"."visibility" = 'public' and "scraps"."group_id" is null) or ("scraps"."visibility" = 'group' and "scraps"."group_id" is not null));--> statement-breakpoint
ALTER TABLE "scraps" ADD CONSTRAINT "scraps_type_check" CHECK ("scraps"."type" in ('text', 'image', 'book', 'music'));--> statement-breakpoint
ALTER TABLE "scraps" ADD CONSTRAINT "scraps_visibility_check" CHECK ("scraps"."visibility" in ('public', 'group'));