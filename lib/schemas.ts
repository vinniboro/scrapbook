import { z } from "zod";

export const visibilitySchema = z.enum(["public", "private"]);

export const textScrapSchema = z.object({
  type: z.literal("text"),
  visibility: visibilitySchema,
  body: z.string().min(1).max(8000),
});

export const imageMetaSchema = z.object({
  type: z.literal("image"),
  visibility: visibilitySchema,
  body: z.string().max(8000).optional(),
});

export const redeemSchema = z.object({
  token: z.string().min(16).max(128),
});

export const disconnectSchema = z.object({
  userId: z.string().uuid(),
});

export const scrapPatchSchema = z
  .object({
    visibility: visibilitySchema.optional(),
    body: z.string().min(1).max(8000).optional(),
  })
  .refine((value) => value.visibility !== undefined || value.body !== undefined, {
    message: "empty patch",
  });

export const cursorQuerySchema = z.object({
  cursor: z.string().optional(),
});

export type TextScrapInput = z.infer<typeof textScrapSchema>;
export type ScrapPatch = z.infer<typeof scrapPatchSchema>;
