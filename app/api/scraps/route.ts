import { getImageStore } from "@/lib/blob";
import { jsonError, requireMember, requestIp } from "@/lib/http";
import { createScrap, serializeScrap } from "@/lib/scraps";
import {
  bookScrapSchema,
  imageMetaSchema,
  musicScrapSchema,
  textScrapSchema,
} from "@/lib/schemas";
import { enforceScrapCreateRateLimit } from "@/lib/connect";
import { validateImageFile } from "@/lib/upload";
import { parseMusicUrl } from "@/lib/music";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const member = await requireMember();
  if (!member.ok) return member.error;
  const ip = requestIp(request);
  if (!(await enforceScrapCreateRateLimit(member.db, member.userId, ip))) {
    return jsonError(429, "rate_limit");
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const parsed = imageMetaSchema.safeParse({
      type: form.get("type") || "image",
      visibility: form.get("visibility"),
      groupId: form.get("groupId") || undefined,
      body: form.get("body") || undefined,
    });
    if (!parsed.success) {
      return jsonError(400, "visibility is required");
    }
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError(400, "file required");
    const imageError = validateImageFile(file);
    if (imageError === "unsupported") return jsonError(400, "unsupported image");
    if (imageError === "too_large") return jsonError(400, "file too large");
    if (imageError === "missing") return jsonError(400, "file required");
    const bytes = Buffer.from(await file.arrayBuffer());
    try {
      const scrap = await createScrap(
        member.db,
        member.userId,
        {
          type: "image",
          visibility: parsed.data.visibility,
          groupId: parsed.data.groupId,
          body: parsed.data.body,
          bytes,
          contentType: file.type,
        },
        getImageStore(),
      );
      return Response.json(serializeScrap(scrap), { status: 201 });
    } catch {
      return jsonError(400, "invalid audience");
    }
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError(400, "invalid json");
  }

  const type =
    typeof json === "object" && json !== null && "type" in json
      ? (json as { type: unknown }).type
      : undefined;

  try {
    if (type === "book") {
      const parsed = bookScrapSchema.safeParse(json);
      if (!parsed.success) return jsonError(400, "invalid scrap");
      const scrap = await createScrap(
        member.db,
        member.userId,
        parsed.data,
        getImageStore(),
      );
      return Response.json(serializeScrap(scrap), { status: 201 });
    }
    if (type === "music") {
      const parsed = musicScrapSchema.safeParse(json);
      if (!parsed.success) return jsonError(400, "invalid scrap");
      if (!parseMusicUrl(parsed.data.musicUrl)) {
        return jsonError(400, "invalid music url");
      }
      const scrap = await createScrap(
        member.db,
        member.userId,
        parsed.data,
        getImageStore(),
      );
      return Response.json(serializeScrap(scrap), { status: 201 });
    }
    const parsed = textScrapSchema.safeParse(json);
    if (!parsed.success) {
      const missingVisibility =
        typeof json === "object" && json !== null && !("visibility" in json);
      return jsonError(
        400,
        missingVisibility ? "visibility is required" : "invalid scrap",
      );
    }
    const scrap = await createScrap(
      member.db,
      member.userId,
      parsed.data,
      getImageStore(),
    );
    return Response.json(serializeScrap(scrap), { status: 201 });
  } catch {
    return jsonError(400, "invalid audience");
  }
}
