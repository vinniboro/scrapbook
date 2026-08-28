import { z } from "zod";

export const audienceSchema = z
  .object({
    visibility: z.enum(["public", "group"]),
    groupId: z.string().uuid().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.visibility === "public" && value.groupId) {
      ctx.addIssue({ code: "custom", message: "public scraps cannot have a group" });
    }
    if (value.visibility === "group" && !value.groupId) {
      ctx.addIssue({ code: "custom", message: "group scraps need a groupId" });
    }
  });

export const textScrapSchema = z.object({
  type: z.literal("text"),
  visibility: z.enum(["public", "group"]),
  groupId: z.string().uuid().optional().nullable(),
  body: z.string().min(1).max(8000),
});

export const imageMetaSchema = z.object({
  type: z.literal("image"),
  visibility: z.enum(["public", "group"]),
  groupId: z.string().uuid().optional().nullable(),
  body: z.string().max(8000).optional(),
});

export const bookScrapSchema = z.object({
  type: z.literal("book"),
  visibility: z.enum(["public", "group"]),
  groupId: z.string().uuid().optional().nullable(),
  googleVolumeId: z.string().min(1).max(64),
  bookTitle: z.string().min(1).max(300),
  bookAuthors: z.string().max(300).optional().nullable(),
  bookThumbnailUrl: z.string().url().max(500).optional().nullable(),
});

export const musicScrapSchema = z.object({
  type: z.literal("music"),
  visibility: z.enum(["public", "group"]),
  groupId: z.string().uuid().optional().nullable(),
  musicUrl: z.string().url().max(500),
  musicTitle: z.string().max(200).optional(),
});

export const redeemSchema = z.object({
  token: z.string().min(16).max(128),
});

export const disconnectSchema = z.object({
  userId: z.string().uuid(),
});

export const scrapPatchSchema = z
  .object({
    visibility: z.enum(["public", "group"]).optional(),
    groupId: z.string().uuid().optional().nullable(),
    body: z.string().min(1).max(8000).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "empty patch",
  });

export const cursorQuerySchema = z.object({
  cursor: z.string().optional(),
});

export const groupCreateSchema = z.object({
  name: z.string().min(1).max(80),
});

export const groupPatchSchema = z.object({
  name: z.string().min(1).max(80),
});

export const groupMemberSchema = z.object({
  userId: z.string().uuid(),
});

export const albumCreateSchema = z.object({
  title: z.string().min(1).max(80),
  visibility: z.enum(["public", "group"]),
  groupId: z.string().uuid().optional().nullable(),
});

export const albumItemSchema = z.object({
  scrapId: z.string().uuid(),
});

export const profilePatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  handle: z.string().min(2).max(24).regex(/^[a-z0-9-]+$/).optional(),
});

export const booksQuerySchema = z.object({
  q: z.string().min(1).max(120),
});

export type TextScrapInput = z.infer<typeof textScrapSchema>;
export type ScrapPatch = z.infer<typeof scrapPatchSchema>;
